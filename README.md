# Pyy

Portfolio and borrowing-base optimization notes, experiments, and a working Excel-integrated Python optimizer.

## Repository Map

- `src/portfolio_optimizer.py` - current runnable optimizer reconstructed from screenshots. It reads an Excel workbook, builds an OR-Tools CP-SAT model, and writes optimized exposure values back to Excel.
- `docs/portfolio-optimization-guide.md` - the original long-form guide for Excel + Python portfolio optimization.
- `docs/history/` - dated research notes and earlier implementations, including SciPy, greedy search, hill climbing, PySCIPOpt/SCIP, and debugging notes.
- `docs/power-query/` - Power Query snippets for token requests and table-combining workflows.
- `docs/packaging/` - PyInstaller packaging notes.

## Quick Start

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src\portfolio_optimizer.py
```

The current script expects an Excel workbook shaped like the original working file, especially the header/data ranges around `B367:Z667`. Tkinter is used for the file picker and is included with most standard Python installs.

## Working Convention

Keep runnable code in `src/`. Put dated experiments in `docs/history/` using `YYYY-MM-DD-topic.md`. Put Excel helper snippets that are not part of the Python optimizer in `docs/power-query/` or another focused docs folder.
