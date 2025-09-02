let
    // Read table covering A1:B4, named "Params"
    Params = Excel.CurrentWorkbook(){[Name="Params"]}[Content],
    Cols   = Table.ColumnNames(Params),
    C1     = Cols{0},   // first column (A)
    C2     = Cols{1},   // second column (B)

    // Pick values by position (per your cell layout)
    url         = Record.Field(Params{0}, C2),  // B1
    headerName  = Record.Field(Params{1}, C1),  // A2
    headerValue = Record.Field(Params{1}, C2),  // B2
    username    = Record.Field(Params{2}, C2),  // B3
    password    = Record.Field(Params{3}, C2),  // B4

    // Build Basic auth header
    basicAuth = "Basic " & Binary.ToText(
        Text.ToBinary(username & ":" & password),
        BinaryEncoding.Base64
    ),

    // Assemble headers (adds your custom header and Authorization)
    headersBase = [ Accept = "application/json" ],
    headers1    = Record.AddField(headersBase, headerName, headerValue),
    headers     = Record.AddField(headers1, "Authorization", basicAuth),

    // POST (Content triggers POST). Add Content-Type below if needed.
    // e.g., include #"Content-Type"="application/x-www-form-urlencoded" in headers1/headers
    raw = Web.Contents(url, [ Headers = headers, Content = Text.ToBinary("") ]),

    // Parse JSON and build "token_type access_token"
    ans   = Json.Document(raw),
    token = Text.From(ans[token_type]) & " " & Text.From(ans[access_token])
in
    token
