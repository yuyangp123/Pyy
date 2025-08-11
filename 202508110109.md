Below is a compact refactor of your original script that introduces an *adaptive step size*:

-  Start with a coarse jump (e.g., 10% of each variable’s upper bound).  
-  Whenever a proposed batch increase violates any constraint, the step size for **all** variables is halved.  
-  The loop stops when no feasible increase is found at the current step size and the step size has already been reduced to 1.

```python
import xlwings as xw
import numpy as np
import random

# 1) Workbook & ranges ― amend as needed
wb   = xw.Book(r"your_excel_file.xlsx")
sh   = wb.sheets["Sheet1"]

VAR_RANGE        = "D368:D667"   # 300 decision variables
UPPER_RANGE      = "C368:C667"
FACTOR_RANGE     = "K368:K667"
CONSTRAINT_RANGE = "I15:I51"     # 37 constraint cells
LIMIT_RANGE      = "E15:E51"

uppers  = sh.range(UPPER_RANGE).value
factors = sh.range(FACTOR_RANGE).value
n       = len(uppers)

# 2) Helpers
def write_vars(vals):           # push to Excel
    sh.range(VAR_RANGE).value = [[v] for v in vals]

def constraints_ok():           # recalc + check
    wb.app.calculate()
    c_vals  = sh.range(CONSTRAINT_RANGE).value
    limits  = sh.range(LIMIT_RANGE).value
    return all(c=1 and iteration= uppers[i]:           # already at upper bound
            continue

        trial = x.copy()
        trial[i] = min(uppers[i], trial[i] + step)
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
wb.save(); wb.close()
```

Why it is faster:

1. **Big leaps first** – quickly approaches a promising region of the search space.  
2. **Automatic back-off** – as soon as large jumps cause infeasibility, the algorithm tightens to smaller, “fine-tuning” moves.  
3. **Single sweep per step size** – the outer loop only drops `step` when an entire randomized sweep finds no legal increase, reducing redundant recalculations.
