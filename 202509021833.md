Here’s a straight Power Query (M) version that does the same thing—POSTs, parses JSON, and builds "token_type access_token". No VBA needed.

Option 1 — Simple one-off query (returns the token string)

Paste this into Power Query > New Query > Blank Query > Advanced Editor:

let
    // === CONFIG ===
    url = "https://aaa",
    username = "username",
    password = "password",
    customHeaders = [ bbb = "value", Accept = "application/json" ],

    // Build Basic auth header
    basicAuth = 
        "Basic " & Binary.ToText(
            Text.ToBinary(username & ":" & password),
            BinaryEncoding.Base64
        ),

    // Merge headers
    headers = Record.Combine({ customHeaders, [ Authorization = basicAuth ] }),

    // If the API needs a body, set it here (empty by default)
    bodyText = "",    // e.g. "grant_type=client_credentials&scope=read"
    options = [ Headers = headers, Content = Text.ToBinary(bodyText) ],

    // POST
    raw = Web.Contents(url, options),

    // Parse JSON -> record with token_type & access_token
    ans = Json.Document(raw),

    // Build "Bearer xxx" (or whatever token_type is)
    token = Text.From(ans[token_type]) & " " & Text.From(ans[access_token])
in
    token

If your endpoint expects form data, set
customHeaders = [ bbb="value", Accept="application/json", #"Content-Type"="application/x-www-form-urlencoded" ]
and put the form string (e.g., grant_type=client_credentials) in bodyText.

⸻

Option 2 — Reusable function + example call

Function (query name: GetToken)

(url as text, customHeaders as record, username as text, password as text, optional bodyText as nullable text) as text =>
let
    basicAuth = "Basic " & Binary.ToText(Text.ToBinary(username & ":" & password), BinaryEncoding.Base64),
    headers   = Record.Combine({ customHeaders, [ Authorization = basicAuth, Accept = "application/json" ] }),
    content   = if bodyText <> null then Text.ToBinary(bodyText) else Text.ToBinary(""),
    raw       = Web.Contents(url, [ Headers = headers, Content = content ]),
    ans       = Json.Document(raw),
    token     = Text.From(ans[token_type]) & " " & Text.From(ans[access_token])
in
    token

Caller (returns the token)

let
    token = GetToken(
        "https://aaa",
        [ bbb = "value",  #"Content-Type" = "application/x-www-form-urlencoded" ],
        "username",
        "password",
        "grant_type=client_credentials&scope=read"
    )
in
    token


⸻

Using the token in another query

let
    // Get token from the query above
    token = YourTokenQueryName, // or call GetToken(...) inline

    // Call a protected endpoint
    resp = Web.Contents(
        "https://api.example.com/resource",
        [ Headers = [ Authorization = token, Accept = "application/json" ] ]
    ),
    data = Json.Document(resp)
in
    data

Notes
	•	Power Query doesn’t expose a “verify=False” toggle; it uses Windows’ certificate store. For self-signed certs, install the CA/root properly.
	•	If the API returns an error status, Power Query throws. You can wrap Web.Contents in try … otherwise if you want custom error handling.
