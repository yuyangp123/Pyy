Here’s a reliable Power Query (M) script that finds all Excel Tables in the current workbook and appends them into one combined table. It also adds a SourceTable column so you know which original table each row came from.

let
    // Get all objects from the workbook
    Source = Excel.CurrentWorkbook(),

    // Keep only Excel Tables (exclude named ranges, queries, etc.) and non-hidden ones
    TablesOnly = Table.SelectRows(Source, each [Kind] = "Table" and ([Hidden]? = false)),

    // For each table: promote first row to headers (if needed) and add a SourceTable column
    WithName =
        Table.AddColumn(
            TablesOnly,
            "WithName",
            (row as record) as table =>
                let
                    t0 = row[Content],
                    t1 = try Table.PromoteHeaders(t0, [PromoteAllScalars = true]) otherwise t0,
                    t2 = Table.AddColumn(t1, "SourceTable", each row[Name], type text)
                in
                    t2,
            type table
        ),

    // Combine all tables into one
    Combined = Table.Combine(WithName[WithName])
in
    Combined

Notes
	•	Column alignment: Table.Combine matches by column name; missing columns in any source table will be filled with null.
	•	Headers: If your source tables already have proper headers, the PromoteHeaders try/otherwise block won’t hurt; it just leaves them as-is.
	•	Filtering: Remove ([Hidden]? = false) if you also want to include hidden tables.
