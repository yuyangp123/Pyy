import xlwings as xw
import numpy as np
import random
from typing import List  # For type hints

# 1) Workbook & ranges ― amend as needed
wb = xw.Book(r"your_excel_file.xlsx")
sh = wb.sheets["Sheet1"]

VAR_RANGE = "D368:D667"   # 300 decision variables
UPPER_RANGE = "C368:C667"
FACTOR_RANGE = "K368:K667"
CONSTRAINT_RANGE = "I15:I51"     # 37 constraint cells
LIMIT_RANGE = "E15:E51"

uppers: List[float] = sh.range(UPPER_RANGE).value
factors: List[float] = sh.range(FACTOR_RANGE).value
n: int = len(uppers)

# 2) Helpers
def write_vars(vals: List[int]) -> None:  # push to Excel
    sh.range(VAR_RANGE).value = [[v] for v in vals]

def constraints_ok() -> bool:  # recalc + check
    wb.app.calculate()
    c_vals: List[float] = sh.range(CONSTRAINT_RANGE).value
    limits: List[float] = sh.range(LIMIT_RANGE).value
    return all(c <= l for c, l in zip(c_vals, limits))

def obj(vals: List[int]) -> float:  # objective value
    return float(np.dot(vals, factors))

# 3) Initialise ― 10% of bound, floored to int
x: List[int] = [max(0, int(u / 10)) for u in uppers]
write_vars(x)
if not constraints_ok():
    raise ValueError("Initial point infeasible; shrink initial guess.")

# 4) Adaptive hill-climb
step: int = max(1, int(min(uppers) / 10))   # start big, ≥1
iteration: int = 0
MAX_ITERS: int = 10_000

while step >= 1 and iteration < MAX_ITERS:
    iteration += 1
    improved: bool = False

    # random order each sweep
    for i in random.sample(range(n), n):
        if x[i] >= uppers[i]:           # already at upper bound
            continue

        trial: List[int] = x.copy()
        trial[i] = min(int(uppers[i]), trial[i] + step)  # Ensure int
        write_vars(trial)

        if constraints_ok():            # keep the increase
            x = trial
            improved = True
            print(f"Iter {iteration:4d} | step {step} | var {i} → {x[i]} | Obj {obj(x):,.0f}")
            break                       # restart sweep after any success

        # revert (was written to Excel above)
        write_vars(x)

    if not improved:                    # nothing worked → shrink step
        step //= 2                      # geometric back-off

print(f"Done in {iteration} iterations. Final objective = {obj(x):,.0f}")
wb.save()
wb.close()
