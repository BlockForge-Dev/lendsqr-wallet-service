# ER Diagram Source

```mermaid
erDiagram
  USERS ||--|| WALLETS : owns
  USERS ||--o{ BLACKLIST_CHECKS : has
  WALLETS ||--o{ TRANSACTIONS : records
  WALLETS ||--o{ TRANSACTIONS : counterparty
  TRANSACTIONS ||--o| TRANSACTIONS : related_to

  USERS {
    uuid id PK
    string first_name
    string last_name
    string email UK
    string phone UK
    string bvn UK
    timestamp created_at
    timestamp updated_at
  }

  WALLETS {
    uuid id PK
    uuid user_id FK_UK
    bigint balance_minor
    string currency
    timestamp created_at
    timestamp updated_at
  }

  TRANSACTIONS {
    uuid id PK
    string reference UK
    uuid wallet_id FK
    enum type
    bigint amount_minor
    bigint balance_before_minor
    bigint balance_after_minor
    enum status
    uuid counterparty_wallet_id FK
    uuid related_transaction_id FK
    string description
    timestamp created_at
  }

  BLACKLIST_CHECKS {
    uuid id PK
    uuid user_id FK
    string identity
    enum identity_type
    string provider
    boolean is_blacklisted
    json response_payload
    timestamp created_at
  }
```
