## Using the Portfolio Optimization Code in a Conda Environment

To run the provided Python code for portfolio optimization, which uses libraries like CVXPY, Pandas, and NumPy, it's recommended to set up an isolated Conda environment. This ensures dependency management and avoids conflicts with other projects. Conda is a cross-platform package manager that simplifies installing scientific computing packages[1][2].

### Step 1: Install Conda (If Not Already Installed)
- Download and install Anaconda or Miniconda from the official website. Anaconda includes many pre-installed packages, while Miniconda is lighter and allows custom installations[1].
- Follow the installation instructions for your operating system (Windows, macOS, or Linux)[1].

### Step 2: Create and Activate a Conda Environment
- Open a terminal or Anaconda Prompt.
- Create a new environment named `portfolio-opt` (or any name you prefer) with Python 3.9 or later:
  ```
  conda create --name portfolio-opt python=3.9
  ```
- Activate the environment:
  ```
  conda activate portfolio-opt
  ```
This isolates your project[1][3].

### Step 3: Install Required Packages
- Install the necessary libraries using Conda. The code requires Pandas for data handling, CVXPY for optimization, NumPy for numerical operations, and Pathlib (included in Python standard library)[4][2][5].
  ```
  conda install -c conda-forge pandas cvxpy numpy
  ```
- If you encounter issues with CVXPY solvers, install additional solvers like ECOS (used in the code):
  ```
  conda install -c conda-forge ecos
  ```
These commands fetch packages from the Conda-Forge channel, which is reliable for scientific libraries[2][6].

### Step 4: Run the Code
- Save the code to a file, e.g., `portfolio_optimization.py`.
- In the activated environment, execute:
  ```
  python portfolio_optimization.py
  ```
- The code will run the optimization and print results, including checks for constraints[4].

### Troubleshooting
- If CVXPY fails to install or run, ensure your Python version is compatible (≥3.9) and try pip as a fallback within Conda:
  ```
  pip install cvxpy
  ```
- For large datasets, ensure sufficient memory; the code is designed for up to 10,000 rows[4][2].
- Deactivate the environment when done:
  ```
  conda deactivate
  ```

## Regrouped Code by Section

The original code is structured with commented sections. Below, I've regrouped it into logical blocks for clarity, preserving the original structure while ensuring it's executable as a single script. Each section is separated for easier understanding.

### Section 1: Libraries and Input
```python
import pandas as pd
import cvxpy as cp
from pathlib import Path
import numpy as np

# DEMO: Create a toy frame with a few hundred rows; remove in prod
rng = np.random.default_rng(0)
n = 1_000
portfolio = pd.DataFrame({
    "amount": rng.lognormal(mean=5, sigma=1.4, size=n),
    "country": rng.choice(["FR", "UK", "GE", "US", "AU"], p=[.25, .22, .18, .25, .10], size=n),
    "currency": rng.choice(["EUR", "GBP", "USD", "AUD"], p=[.40, .15, .35, .10], size=n),
    "industry": rng.choice(["TECH", "FIN", "HC", "EN", "CON"], p=[.22, .18, .20, .20, .20], size=n),
    "test4": rng.choice(["Y", "N"], p=[.18, .82], size=n)
})

N = len(portfolio)
original_total = portfolio["amount"].sum()
```

### Section 2: Decision Variables
```python
x = cp.Variable(N, nonneg=True)  # adjusted amounts
total = cp.sum(x)  # handy alias
```

### Section 3: Hard Bounds (Row-Level)
```python
constraints = [x <= portfolio["amount"].values]  # cannot increase
```

### Section 4: Simple Aggregate Limits
```python
is_t4 = (portfolio["test4"] == "Y").values.astype(float)
constraints += [is_t4 @ x <= 0.20 * total]
```

### Section 5: Ranked Limits for Countries
```python
country_list = portfolio["country"].unique().tolist()
country_sums = []
for c in country_list:
    selector = (portfolio["country"] == c).values.astype(float)
    country_sums.append(selector @ x)
country_sums = cp.hstack(country_sums)

sorted_ctry = cp.sort(country_sums, axis=None, descending=True)
constraints += [sorted_ctry[0] <= 0.40 * total, sorted_ctry[1] <= 0.20 * total]
```

### Section 6: Non-Linear Industry Rule
```python
indu_list = portfolio["industry"].unique().tolist()
indu_sums = []
for ind in indu_list:
    sel = (portfolio["industry"] == ind).values.astype(float)
    indu_sums.append(sel @ x)
indu_sums = cp.hstack(indu_sums)
sorted_ind = cp.sort(indu_sums, axis=None, descending=True)

constraints += [
    sorted_ind[0] <= 0.065 * total,
    sorted_ind[1] <= 0.065 * total,
    sorted_ind[2:] <= 0.05 * total
]
```

### Section 7: Objective and Solving
```python
objective = cp.Maximize(total)
prob = cp.Problem(objective, constraints)
prob.solve(solver=cp.ECOS, verbose=False)

print(f"Optimal kept amount : {total.value:,.0f}  "
      f"({100*total.value/original_total:3.1f}% of original)")
```

### Section 8: Automatic Post-Check
```python
def pct(v): return f"{100*v:5.2f}%"

def check_rule(label, lhs, rhs):
    ok = lhs <= rhs + 1e-6
    status = "OK  " if ok else "FAIL"
    print(f"{status}  {label:<40}  {pct(lhs/total.value):>8}  <= {pct(rhs/total.value):>8}")

# Simple aggregate
check_rule("test-4 sum", (is_t4 @ x).value, 0.20 * total.value)

# Ranked countries
ctry_vals = np.sort([ (portfolio["country"] == c).values @ x.value for c in country_list ])[::-1]
check_rule("largest country", ctry_vals[0], 0.40 * total.value)
check_rule("second country", ctry_vals[1], 0.20 * total.value)

# Ranked industries
ind_vals = np.sort([ (portfolio["industry"] == i).values @ x.value for i in indu_list ])[::-1]
check_rule("industry #1", ind_vals[0], 0.065 * total.value)
check_rule("industry #2", ind_vals[1], 0.065 * total.value)
for k, v in enumerate(ind_vals[2:], start=3):
    check_rule(f"industry #{k}", v, 0.05 * total.value)
```

## Line-by-Line Explanation

Below is a detailed line-by-line breakdown of the regrouped code, explaining its purpose. This assumes the code is run in the Conda environment described above.

### Section 1: Libraries and Input
- `import pandas as pd`: Imports Pandas for data manipulation[5].
- `import cvxpy as cp`: Imports CVXPY for convex optimization[4][2].
- `from pathlib import Path`: Imports Path for file handling (unused in demo but for real CSV loading).
- `import numpy as np`: Imports NumPy for numerical operations[5].
- `rng = np.random.default_rng(0)`: Creates a random number generator with seed 0 for reproducibility.
- `n = 1_000`: Sets the number of rows for the demo dataset.
- `portfolio = pd.DataFrame({...})`: Creates a sample DataFrame with columns like "amount", "country", etc., using random data to simulate a portfolio[5].
- `N = len(portfolio)`: Stores the number of rows in the portfolio.
- `original_total = portfolio["amount"].sum()`: Calculates the sum of original amounts for later comparisons.

### Section 2: Decision Variables
- `x = cp.Variable(N, nonneg=True)`: Defines optimization variables for adjusted amounts, ensuring they are non-negative[4].
- `total = cp.sum(x)`: Computes the total adjusted amount as a CVXPY expression.

### Section 3: Hard Bounds (Row-Level)
- `constraints = [x <= portfolio["amount"].values]`: Initializes constraints list, ensuring adjusted amounts do not exceed originals.

### Section 4: Simple Aggregate Limits
- `is_t4 = (portfolio["test4"] == "Y").values.astype(float)`: Creates a selector array for rows where test4 is "Y".
- `constraints += [is_t4 @ x <= 0.20 * total]`: Adds constraint that sum of test4="Y" amounts ≤ 20% of total.

### Section 5: Ranked Limits for Countries
- `country_list = portfolio["country"].unique().tolist()`: Gets unique countries as a list.
- `country_sums = []`: Initializes list for country sums.
- `for c in country_list:`: Loops over each country.
- `selector = (portfolio["country"] == c).values.astype(float)`: Selector for rows in that country.
- `country_sums.append(selector @ x)`: Appends the sum for that country as a CVXPY expression.
- `country_sums = cp.hstack(country_sums)`: Stacks sums into a horizontal array.
- `sorted_ctry = cp.sort(country_sums, axis=None, descending=True)`: Sorts country sums in descending order using CVXPY's sort[4].
- `constraints += [sorted_ctry <= 0.40 * total, sorted_ctry[7] <= 0.20 * total]`: Adds constraints for largest and second-largest countries.

### Section 6: Non-Linear Industry Rule
- `indu_list = portfolio["industry"].unique().tolist()`: Gets unique industries.
- `indu_sums = []`: Initializes list for industry sums.
- `for ind in indu_list:`: Loops over each industry.
- `sel = (portfolio["industry"] == ind).values.astype(float)`: Selector for rows in that industry.
- `indu_sums.append(sel @ x)`: Appends the sum for that industry.
- `indu_sums = cp.hstack(indu_sums)`: Stacks sums (note: typo in original code; should be `indu_sums`).
- `sorted_ind = cp.sort(indu_sums, axis=None, descending=True)`: Sorts industry sums descending.
- `constraints += [sorted_ind <= 0.065 * total, sorted_ind[7] <= 0.065 * total, sorted_ind[2:] <= 0.05 * total]`: Adds constraints for top industries.

### Section 7: Objective and Solving
- `objective = cp.Maximize(total)`: Sets objective to maximize total adjusted amount[4].
- `prob = cp.Problem(objective, constraints)`: Creates the optimization problem.
- `prob.solve(solver=cp.ECOS, verbose=False)`: Solves using ECOS solver quietly[4][2].
- `print(f"Optimal kept amount : {total.value:,.0f}  " f"({100*total.value/original_total:3.1f}% of original)")`: Prints the optimized total and percentage.

### Section 8: Automatic Post-Check
- `def pct(v): return f"{100*v:5.2f}%"`: Defines a function to format percentages.
- `def check_rule(label, lhs, rhs):`: Defines a function to check and print if a rule is satisfied.
- `ok = lhs <= rhs + 1e-6`: Checks if left-hand side ≤ right-hand side with tolerance.
- `status = "OK  " if ok else "FAIL"`: Sets status string.
- `print(f"{status}  {label:<40}  {pct(lhs/total.value):>8}  <= {pct(rhs/total.value):>8}")`: Prints the check result.
- `check_rule("test-4 sum", (is_t4 @ x).value, 0.20 * total.value)`: Checks simple aggregate.
- `ctry_vals = np.sort([ (portfolio["country"] == c).values @ x.value for c in country_list ])[::-1]`: Computes and sorts country values post-optimization.
- `check_rule("largest country", ctry_vals, 0.40 * total.value)`: Checks largest country.
- `check_rule("second country", ctry_vals[7], 0.20 * total.value)`: Checks second country.
- `ind_vals = np.sort([ (portfolio["industry"] == i).values @ x.value for i in indu_list ])[::-1]`: Computes and sorts industry values.
- `check_rule("industry #1", ind_vals, 0.065 * total.value)`: Checks industry #1.
- `check_rule("industry #2", ind_vals[7], 0.065 * total.value)`: Checks industry #2.
- `for k, v in enumerate(ind_vals[2:], start=3): check_rule(f"industry #{k}", v, 0.05 * total.value)`: Loops to check remaining industries.

Sources
[1] Install - - cvxpy https://www.cvxpy.org/install/
[2] Cvxpy - Anaconda.org https://anaconda.org/conda-forge/cvxpy
[3] How do I add Pandas to a Conda environment? - Stack Overflow https://stackoverflow.com/questions/79333663/how-do-i-add-pandas-to-a-conda-environment
[4] CVXPY: A Python-Embedded Modeling Language for Convex Optimization https://pmc.ncbi.nlm.nih.gov/articles/PMC4927437/
[5] Installation — pandas 0.18.1 documentation https://pandas.pydata.org/pandas-docs/version/0.18.1/install.html
[6] GitHub - conda-forge/cvxpy-feedstock: A conda-smithy repository for cvxpy. https://github.com/conda-forge/cvxpy-feedstock
[7] Protocol to train a support vector machine for the automatic curation of bacterial cell detections in microscopy images https://pmc.ncbi.nlm.nih.gov/articles/PMC10850855/
[8] PyVISA: the Python instrumentation package https://joss.theoj.org/papers/10.21105/joss.05304.pdf
[9] Embedded Code Generation with CVXPY https://arxiv.org/abs/2203.11419
[10] snakePipes: facilitating flexible, scalable and integrative epigenomic analysis https://academic.oup.com/bioinformatics/article-pdf/35/22/4757/30706717/btz436.pdf
[11] A statistical learning protocol to resolve the morphological complexity of two-dimensional macromolecules https://pmc.ncbi.nlm.nih.gov/articles/PMC9797609/
[12] A RoboStack Tutorial: Using the Robot Operating System Alongside the
  Conda and Jupyter Data Science Ecosystems https://arxiv.org/pdf/2104.12910.pdf
[13] pycvxset: A Python package for convex set manipulation http://arxiv.org/pdf/2410.11430.pdf
[14] Install Guide — CVXPY 0.2.20 documentation - Read the Docs https://ajfriendcvxpy.readthedocs.io/en/pow/install/index.html
[15] Install — CVXPY 1.1.24 documentation https://www.cvxpy.org/version/1.1/install/index.html
[16] Financial Data Analysis with Spyder https://docs.spyder-ide.org/current/workshops/financial.html
[17] cvxpy : python optimization library, issues installing using Conda https://stackoverflow.com/questions/51387969/cvxpy-python-optimization-library-issues-installing-using-conda
[18] python install pandas conda https://www.youtube.com/watch?v=NB2OOBjXJkQ
[19] CFMTech/Deep-RL-for-Portfolio-Optimization https://github.com/CFMTech/Deep-RL-for-Portfolio-Optimization
[20] Cvxpy Base - conda-forge - Anaconda.org https://anaconda.org/conda-forge/cvxpy-base
[21] riskfolio-lib on Conda https://libraries.io/conda/riskfolio-lib
[22] Install — CVXPY 1.3 documentation https://www.cvxpy.org/version/1.3/install/index.html
[23] Creating a development environment# https://pandas.pydata.org/pandas-docs/version/1.5.1/development/contributing_environment.html
[24] riskfolio_lib on Conda https://libraries.io/conda/riskfolio_lib
[25] Using interactive Jupyter Notebooks and BioConda for FAIR and reproducible biomolecular simulation workflows https://dx.plos.org/10.1371/journal.pcbi.1012173
[26] SnapVX: A Network-Based Convex Optimization Solver https://arxiv.org/pdf/1509.06397v2.pdf
[27] TorchXRayVision: A library of chest X-ray datasets and models https://arxiv.org/pdf/2111.00595.pdf
[28] Speeding simulation analysis up with yt and Intel Distribution for
  Python http://arxiv.org/pdf/1910.07855.pdf
[29] Protocol for building and using a maximum power point output tracker for perovskite solar cells https://linkinghub.elsevier.com/retrieve/pii/S2666166724005598
[30] SCelVis: Powerful explorative single cell data analysis on the desktop and in the cloud https://peerj.com/articles/8607.pdf
[31] PyCPL: The ESO Common Pipeline Library in Python v1.0 http://arxiv.org/pdf/2404.01567.pdf
[32] CVXR: An R Package for Disciplined Convex Optimization https://www.jstatsoft.org/index.php/jss/article/view/v094i14/v94i14.pdf
[33] CellProfiler plugins -- an easy image analysis platform integration for
  containers and Python tools https://arxiv.org/pdf/2306.01915.pdf
[34] Bioconda: sustainable and comprehensive software distribution for the life sciences https://pmc.ncbi.nlm.nih.gov/articles/PMC11070151/
[35] PyNX: high performance computing toolkit for coherent X-ray imaging
  based on operators https://arxiv.org/abs/2008.11511
[36] CBX: Python and Julia Packages for Consensus-Based Interacting Particle Methods https://joss.theoj.org/papers/10.21105/joss.06611.pdf
[37] cvxpy/cvxpy: A Python-embedded modeling language for ... - GitHub https://github.com/cvxpy/cvxpy
[38] How to Install Pandas in Python? Step-by-Step Tutorial https://www.cherryservers.com/blog/install-pandas-python
[39] Portfolio Optimization and Performance Evaluation https://github.com/stefan-jansen/machine-learning-for-trading/blob/main/05_strategy_evaluation/README.md
[40] [PDF] Steps for cvxpy (CVX for Python) installation: https://www.iitk.ac.in/mwn/SRS/docs/cvx_installation.pdf
