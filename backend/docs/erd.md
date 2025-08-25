

```mermaid
erDiagram
  SearchSession ||--o{ Offer : "has many"
  Offer ||--o{ PricedOffer : "repriced"
  PricedOffer ||--|| Order : "chosen via pricedOfferId"
  Order ||--o{ Traveler : "passengers"
  Order ||--o{ Payment : "captures"
  Payment ||--o{ Refund : "refunds"
  Order ||--|| PNR : "booking record"
  PNR ||--o{ Ticket : "issued"
  Offer ||--o{ AncillaryOffer : "bags/SSR at search"
  Order ||--o{ AncillaryOrder : "bags/SSR after booking"

  SearchSession {
    uuid id PK
    string origin  "IATA(3)"
    string destination "IATA(3)"
    datetime departure
    datetime return  "nullable"
    jsonb pax
    string cabin
    datetime createdAt
  }

  Offer {
    uuid id PK
    uuid searchSessionId FK
    string provider
    string dedupHash
    jsonb itinerary
    jsonb baggage
    jsonb fareRules
    datetime createdAt
  }

  PricedOffer {
    uuid id PK
    uuid offerId FK
    numeric total
    string currency
    string brand
    jsonb breakdown
    datetime createdAt
  }

  Order {
    uuid id PK
    uuid pricedOfferId FK
    string status
    uuid userId
    datetime createdAt
    datetime updatedAt
  }

  Traveler {
    uuid id PK
    uuid orderId FK
    string type  "ADT/CHD/INF"
    string firstName
    string lastName
    date dob
    string docType
    string docNumber
  }

  Payment {
    uuid id PK
    uuid orderId FK
    numeric amount
    string currency
    string status
    string method
    string txnId  "unique"
    datetime createdAt
  }

  Refund {
    uuid id PK
    uuid paymentId FK
    numeric amount
    string reason
    string status
    datetime createdAt
  }

  PNR {
    uuid id PK
    uuid orderId FK
    string locator "unique"
    string status
    jsonb raw
    datetime createdAt
  }

  Ticket {
    uuid id PK
    uuid pnrId FK
    string ticketNumber "unique"
    string status
    datetime issuedAt
  }

  AncillaryOffer {
    uuid id PK
    uuid offerId FK
    string type "BAG/SEAT/SSR"
    numeric amount
    string currency
    jsonb details
  }

  AncillaryOrder {
    uuid id PK
    uuid orderId FK
    string type "BAG/SEAT/SSR"
    numeric amount
    string currency
    jsonb details
  }