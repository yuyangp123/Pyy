```python
import xlwings as xw
import numpy as np
import random  # For random selection of variables to increment

# Assume the Excel file path (replace with your actual file path)
file_path = 'your_excel_file.xlsx'

# Open the workbook
wb = xw.Book(file_path)
sheet = wb.sheets['Sheet1']  # Replace with your actual sheet name if different

# Define ranges
var_range = 'D368:D667'  # 300 cells
upper_range = 'C368:C667'
factor_range = 'K368:K667'
constraint_range = 'I15:I51'  # 37 constraints
limit_range = 'E15:E51'

# Read upper bounds and factors
uppers = sheet.range(upper_range).value
factors = sheet.range(factor_range).value

# Number of variables
num_vars = len(uppers)

# Initialize decision variables at 1/10 of upper limit (floored to integer)
# Ensure non-negative integers
decision_vars = [max(0, int(upper / 10)) for upper in uppers]

# Function to write variables to Excel
def write_vars(vars_list):
    sheet.range(var_range).value = [[v] for v in vars_list]  # Write as column

# Function to check constraints
def check_constraints():
    # Force recalculation
    wb.app.calculate()
    # Read current constraint values and limits
    constraints = sheet.range(constraint_range).value
    limits = sheet.range(limit_range).value
    # Check if all constraints are satisfied (assuming = uppers[i]:
            continue  # Already at max
        
        # Start with current step size
        step = base_step
        increased = False
        
        while step >= 1 and not increased:
            # Calculate proposed new value
            proposed_value = min(decision_vars[i] + step, uppers[i])
            if proposed_value == decision_vars[i]:
                break  # No increase possible with this step
            
            # Try the increase
            original_value = decision_vars[i]
            decision_vars[i] = proposed_value
            
            # Write to Excel and check constraints
            write_vars(decision_vars)
            if check_constraints():
                # Increase successful, keep it
                successful_increase = True
                increased = True
                print(f"Iteration {iteration}: Increased var {i} by {step} to {decision_vars[i]}. Objective: {compute_objective(decision_vars, factors)}")
                break  # Move to next iteration
            else:
                # Breach: revert and try smaller step
                decision_vars[i] = original_value
                write_vars(decision_vars)  # Revert in Excel
                step = max(1, step // 2)  # Halve the step size (minimum 1)
        
        if increased:
            break  # After successful increase, proceed to next iteration

# After loop, output final objective
final_objective = compute_objective(decision_vars, factors)
print(f"Optimization complete after {iteration} iterations. Final objective: {final_objective}")

# Save and close the workbook
wb.save()
wb.close()
```
