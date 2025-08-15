# Simplified Portfolio Optimizer (reconstructed from screenshots)
# Dependencies: ortools, xlwings, tkinter

import tkinter as tk
from tkinter import filedialog, messagebox

import xlwings as xw
from ortools.sat.python import cp_model


# -----------------------------
# Global constant for concentration factor
# -----------------------------
CF_VALUE = 2_000_000_000  # Fixed concentration factor constant (EUR)


class PortfolioOptimizer:
    def __init__(self):
        # Scale factor to simulate continuous variables via integer scaling.
        self.scale = 100  # 1 unit = 0.01 in real terms
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

    # ---------------------- Helper Methods ---------------------- #
    def clean_header(self, header: str) -> str:
        """Replaces spaces and parentheses with underscores."""
        if header is None:
            return ""
        return str(header).replace(" ", "_").replace("(", "_").replace(")", "_")

    def read_excel_data(self, ws) -> list:
        """
        Reads data from the specified Excel block and returns a list of dicts.
        Header row: B367:Z367
        Data rows:  B368:Z667  (adjust if your sheet is longer/shorter)
        """
        headers = ws.range("B367:Z367").value
        headers = [self.clean_header(h) for h in headers]

        data = ws.range("B368:Z667").value

        records = []
        for row in data:
            if row is None:
                continue
            # stop at the first entirely empty row
            if all(cell in (None, "") for cell in row):
                break
            rec = {headers[i] if i < len(headers) else f"col{i}": row[i] for i in range(len(row))}
            records.append(rec)

        return records

    def safe_float(self, val) -> float:
        """Safely converts a value to float; returns 0.0 on failure."""
        if val is None:
            return 0.0
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    def group_by(self, records, key):
        """Return {key_value: [indices]} for the given key in records."""
        groups = {}
        for i, rec in enumerate(records):
            k = rec.get(key)
            groups.setdefault(k, []).append(i)
        return groups

    def add_group_constraint(self, x, indices, multiplier: float):
        """
        Adds a constraint ensuring that the sum of x[i] for the given indices
        is <= multiplier * CF_VALUE (scaled).
        """
        if not indices:
            return
        rhs = int(round(multiplier * CF_VALUE * self.scale))
        self.model.Add(sum(x[i] for i in indices) <= rhs)

    # ---------------------- Optimization Routine ---------------------- #
    def optimize_portfolio(self, file_name: str, sheet_name: str = None) -> int:
        """
        Reads portfolio data from Excel, builds a CP-SAT MIP model (with continuous variables
        simulated via scaling), and updates the Excel file with the optimized exposures.
        Returns 0 on success, non-zero otherwise.
        """
        wb = xw.Book(file_name)
        ws = wb.sheets[0] if sheet_name is None else wb.sheets[sheet_name]

        # ---- Data Import & Preprocessing ---- #
        records = self.read_excel_data(ws)
        n = len(records)  # Number of exposures
        if n == 0:
            print("No records found in the specified range.")
            return 2

        # Build lists (eligible collateral and advance rates) using safe conversion.
        y_list = [self.safe_float(rec.get("Eligible_Collateral_Value_EUR_", 0)) for rec in records]
        advance_rate = [self.safe_float(rec.get("Asset_Level_Advance_Rate_", 0)) for rec in records]

        # ---- Decision Variables Declaration ---- #
        # x[i] represents the exposure for record i; it is modeled as a scaled integer.
        x = {}
        for i in range(n):
            ub = int(round(y_list[i] * self.scale))
            x[i] = self.model.NewIntVar(0, ub, f"x_{i}")

        # ---- (a) Asset Type Test Constraints ---- #
        test_constraints = {
            "_a_i": 0.10,
            "_a_ii": 0.15,
            "_a_iii": 0.10,
            "_a_iv": 0.20,
            "_a_v": 0.20,
            "_a_vi": 0.25,
            "_a_vii": 0.05,
            "_a_viii": 0.35,
            "_a_ix": 0.10,
            "_a_x": 0.20,
            "_a_xi": 0.075,
            "_a_xii": 0.05,
            "_a_xiii": 0.05,
        }

        for flag, lim_frac in test_constraints.items():
            indices = [i for i in range(n) if records[i].get(flag) is True]
            self.add_group_constraint(x, indices, lim_frac)

        # ---- (d) Currency Test Constraints ---- #
        currency_groups = self.group_by(records, "Currency_of_Collateral_Obligation_CCY_")

        # Selected currencies overall bucket
        selected_currencies = ["AUD", "CAD", "NOK", "SEK", "JPY", "NZD"]
        selected_idxs = []
        for ccy in selected_currencies:
            selected_idxs.extend(currency_groups.get(ccy, []))
        self.add_group_constraint(x, selected_idxs, 0.40)

        # Per-currency limits
        for limit, curr_list in {0.10: ["CAD", "NOK", "SEK", "JPY", "NZD"], 0.15: ["AUD"]}.items():
            for ccy in curr_list:
                indices = currency_groups.get(ccy, [])
                self.add_group_constraint(x, indices, limit)

        # ---- Objective ---- #
        # Goal: maximize weighted exposure by advance rates
        coeffs = [int(round(advance_rate[i] * self.scale)) for i in range(n)]
        self.model.Maximize(sum(coeffs[i] * x[i] for i in range(n)))

        # ---- Solve ---- #
        status = self.solver.Solve(self.model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            print("CP-SAT did not find an optimal solution. Status:", self.solver.StatusName(status))
            return 1

        # ---- Retrieve solution and update Excel ---- #
        final_solution = [self.solver.Value(x[i]) for i in range(n)]
        total_exposure = sum(final_solution) / self.scale  # converting back to original units
        print("Optimized total calibrated exposure =", total_exposure)

        # Write results back into column D starting at row 368
        start_row = 368
        end_row = start_row + n - 1
        ws.range(f"D{start_row}:D{end_row}").value = [[val / self.scale] for val in final_solution]
        print("Final solution updated in Excel.")

        return 0


# ----------------------------- Main ----------------------------- #
def main():
    root = tk.Tk()
    root.withdraw()

    filetypes = [("Excel files", "*.xlsx *.xlsm *.xls"), ("All files", "*.*")]
    file_path = filedialog.askopenfilename(title="Select the Excel workbook", filetypes=filetypes)

    if not file_path:
        messagebox.showwarning("Canceled", "No file selected.")
        return

    try:
        opt = PortfolioOptimizer()
        rc = opt.optimize_portfolio(file_path)  # uses first sheet by default
        if rc == 0:
            messagebox.showinfo("Success", "Optimization completed and results written to Excel.")
        else:
            messagebox.showwarning("Finished with issues", f"Optimization returned code {rc}.")
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")


if __name__ == "__main__":
    main()
