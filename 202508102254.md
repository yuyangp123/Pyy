# Refactored, Debug-Ready Greedy Incremental Optimizer  

Below is a streamlined, fully-commented version of the “constraint-aware greedy incremental” algorithm.  
Key improvements:  

- Eliminated redundant calculations and unused variables.  
- Added explicit Excel range objects to avoid repeated look-ups.  
- Wrapped Excel interactions in functions to reduce boiler- call overhead.  
- Introduced `logging` for clearer progress reporting and easier debugging.  
- Added guard clauses and error handling (e.g., empty cells, missing sheet).  
- Ensured NumPy arrays are always `int64` to prevent implicit float casts.  

```python
import logging
from pathlib import Path
import numpy as np
import xlwings as xw

# ─────────────────────────── CONFIGURATION ─────────────────────────── #
EXCEL_FILE   = Path(r"C:\Path\to\YourWorkbook.xlsx")   #  np.ndarray:
    """Read a 1-col Excel range to a 1-D int64 NumPy array."""
    values = sh.range(rng).options(np.ndarray, dtype=int, ndim=2).value
    return values.flatten().astype(np.int64)

def write_decision_vars(sh, rng, arr: np.ndarray):
    """Write integer decision variables to Excel (column)."""
    sh.range(rng).value = arr.reshape(-1, 1)

def read_constraints(sh, rng) -> np.ndarray:
    """Read current constraint values from Excel as float array."""
    return sh.range(rng).options(np.ndarray, dtype=float, ndim=2).value.flatten()

# ─────────────────────────── CORE ALGORITHM ─────────────────────────── #
def greedy_incremental():
    wb, sh = open_wb(EXCEL_FILE, SHEET_NAME)

    upper_bounds   = np_col(sh, UB_RANGE)
    factors        = np_col(sh, FACTOR_RANGE)
    cons_limits    = np_col(sh, CONS_LIM_RANGE)

    n_vars         = upper_bounds.size
    n_cons         = cons_limits.size

    # Initial solution: ¼ of limits, clipped and int
    sol = np.clip(np.round(START_FRACTION * upper_bounds), 0, upper_bounds).astype(np.int64)
    write_decision_vars(sh, DEC_VAR_RANGE, sol)
    wb.app.calculate()

    # Feasibility check
    if not np.all(read_constraints(sh, CONS_RANGE) = MAX_ATTEMPTS_PER_V:
                continue

            if sol[idx] >= upper_bounds[idx]:
                attempts[idx] = MAX_ATTEMPTS_PER_V  # already at bound
                continue

            # Propose +increment
            proposal = sol.copy()
            proposal[idx] = min(sol[idx] + INCREMENT_SIZE, upper_bounds[idx])

            write_decision_vars(sh, DEC_VAR_RANGE, proposal)
            wb.app.calculate()

            if np.all(read_constraints(sh, CONS_RANGE) 4}  ↑var {idx:>3} to {sol[idx]:>5}  Obj={current_obj:,}")
                break
            else:
                # Infeasible → revert & mark attempt
                write_decision_vars(sh, DEC_VAR_RANGE, sol)
                attempts[idx] += 1

    # Final output
    final_obj = int(np.dot(sol, factors))
    log.info(f"Finished after {total_iters} iterations – final objective {final_obj:,}")
    wb.save()  # comment out if you do not want auto-save
    return sol, final_obj

# ───────────────────────── EXECUTE WHEN RUN DIRECTLY ─────────────────── #
if __name__ == "__main__":
    solution, objective = greedy_incremental()
    print("Best objective:", objective)
```

## What Was Fixed & Why  

1. **Repeated Excel range conversion** → replaced by `np_col()` and cached arrays.  
2. **Implicit float conversions** → cast arrays to `int64` immediately.  
3. **Excel recalculation after failed move** → revert variables before continuing.  
4. **Hard-wired magic numbers** → grouped at the top for quick tuning.  
5. **Logging vs. `print` spam** → replaced with Python’s `logging` so verbosity can be tuned.  
6. **Guard clauses** for missing workbook/sheet and infeasible starting points.  
7. **Global iteration cap** to guarantee termination.  

Paste the script into a `.py` file, update the `EXCEL_FILE` path and `SHEET_NAME`, then run it. You’ll see timestamped progress logs in the console and the optimized decision vector committed to Excel on completion.
