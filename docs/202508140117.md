### Why SCIP May Reduce Variables and How to Debug

Based on the search results and your observation that SCIP reduces some loan values to zero even when adding them back doesn't breach constraints, this is likely due to SCIP's aggressive **presolving** and **dual reductions**. Here's what's happening and how to diagnose it:

## Common Reasons for Variable Reduction

### 1. **Presolving Aggressive Reductions**
SCIP's presolving phase automatically:
- **Fixes variables to zero** if they don't contribute to improving the objective
- **Eliminates redundant variables** through dual reasoning
- **Applies bound tightening** that can make some variables unnecessary

### 2. **Dual Reductions**
SCIP uses dual information to determine that certain variables:
- Cannot improve the objective function given current constraints
- Are dominated by other variables in the optimal solution
- Can be safely fixed without losing optimality

### 3. **Constraint Propagation**
The solver may determine that certain loan adjustments:
- Don't help maximize the total portfolio value
- Are blocked by concentration limits making them ineffective

## How to Debug and Check What's Going Wrong

### 1. **Disable Presolving for Debugging**
```python
# Add this before model.optimize()
from pyscipopt import SCIP_PARAMSETTING

model.setPresolve(SCIP_PARAMSETTING.OFF)  # Disable presolving
model.setHeuristics(SCIP_PARAMSETTING.OFF)  # Disable heuristics
model.disablePropagation()  # Disable propagation
```

### 2. **Enable Verbose Output**
```python
# Add detailed logging
model.setRealParam('display/verblevel', 5)  # Maximum verbosity
model.setBoolParam('display/lpinfo', True)  # LP solver info
model.optimize()
```

### 3. **Check Variable Status and Bounds**
```python
# After optimization, check why variables are zero
for i in range(n):
    val = model.getVal(x[i])
    if val = epsilon, f"MinEpsilon_{i}")
    
    # ... (rest of model setup)
    
    model.optimize()
    
    # DEBUGGING: Analyze results
    print("\n=== Variable Analysis ===")
    zero_vars = []
    for i in range(n):
        val = model.getVal(x[i])
        original_bound = loan_amounts[i]
        if val  0 else 0
        print(f"Test subset: {subset_total} ({subset_pct:.1%}) vs limit 20%")
    
    return {"total_value": model.getVal(G), "adjusted_amounts": [model.getVal(x[i]) for i in range(n)]}
```

## Specific Steps to Take

1. **First**: Run with presolving disabled to see if this resolves the issue
2. **Second**: If variables are still zero, check if your constraints are creating infeasibility
3. **Third**: Look at the constraint shadow prices/dual values to understand which constraints are binding
4. **Fourth**: Consider if your big-M values are too large, causing numerical issues

### Expected Output Analysis
If SCIP is working correctly, you should see in the verbose output:
- Which variables were fixed during presolving and why
- Which constraints are preventing certain variables from being positive
- Dual values indicating constraint tightness

The key insight is that SCIP's reductions are usually correct - if adding back the variables doesn't violate constraints but doesn't improve the objective either, then the solver correctly identified them as unnecessary for the optimal solution.

Let me know what you find when you run the debugging version!

[1] https://optimization-online.org/wp-content/uploads/2016/03/5360.pdf
[2] https://pyscipopt.readthedocs.io/_/downloads/en/latest/pdf/
[3] https://optimization-online.org/wp-content/uploads/2021/12/8728.pdf
[4] https://www.scipopt.org/doc/html/PRESOL.php
[5] https://stackoverflow.com/questions/71197025/setting-constraints-with-variables-as-exponents-in-pyscipopt
[6] https://stackoverflow.com/questions/23514837/scip-unmodified-lp-bound
[7] https://tidel.mie.utoronto.ca/pubs/dualcumulative.pdf
[8] https://pyscipopt.readthedocs.io/en/latest/tutorials/vartypes.html
[9] https://gking.harvard.edu/files/matchp.pdf
[10] https://www.zib.de/userpage/hendel/talk/2018/hiroshima-using-scip-to-solve/slides.pdf
[11] https://imada.sdu.dk/~marco/Misc/PySCIPOpt/scip_8pyx_source.html
[12] https://www.scipopt.org/doc/html/FAQ.php
[13] https://stackoverflow.com/questions/77948273/scip-stuck-in-clique-table-clean-up
[14] https://github.com/SCIP-Interfaces/PySCIPOpt/issues/347
[15] https://www.scipopt.org/doc-5.0.1/html/FAQ.php
[16] https://www.sciencedirect.com/science/article/abs/pii/S0167637724000105
[17] https://scipopt.github.io/PySCIPOpt/docs/html/classpyscipopt_1_1scip_1_1Model.html
[18] https://www.zib.de/userpage/berthold/scip/faq.html
[19] https://www.gams.com/latest/docs/S_SCIP.html
[20] https://github.com/scipopt/PySCIPOpt/issues/621
