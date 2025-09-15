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
