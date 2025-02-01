
# Example Subgraphs

This section provides several subgraph examples to help developers get started with **The Graph**. Each example demonstrates specific configurations and assumes basic familiarity with subgraph components.

---

## Table of Contents

1. **[Aggregations](#aggregations)**  
   This subgraph demonstrates how to aggregate data using block numbers as predictable values. Comments in the schema, subgraph manifest, and mappings provide guidance for implementing custom aggregations.

2. **[Arweave Blocks and Transactions](#arweave-blocks-and-transactions)**  
   This subgraph indexes blocks, transactions, tags, and POAs on the Arweave blockchain. Requires `graph-cli` version 0.30.2 or above to build.

3. **[Cosmos Block Filtering](#cosmos-block-filtering)**  
   This subgraph stores `Block` objects that represent blocks appended to a Cosmos chain, saving only the block number and timestamp to the store.

4. **[Cosmos Osmosis Token Swaps](#cosmos-osmosis-token-swaps)**  
   This subgraph stores `TokenSwap` objects that represent token swaps made using the Generalized Automated Market Maker (GAMM) in the Osmosis chain.

5. **[Cosmos Validator Delegations](#cosmos-validator-delegations)**  
   This subgraph stores `Delegation` objects representing validator delegations on a Cosmos chain.

6. **[Cosmos Validator Rewards](#cosmos-validator-rewards)**  
   This example stores `Reward` objects representing rewards received by validators on a Cosmos chain.

7. **[Ethereum Basic Event Handlers](#ethereum-basic-event-handlers)**  
   This subgraph shows how to handle basic events on the Ethereum blockchain using **The Graph**. It provides a practical implementation of event handlers, showcasing how to index and query blockchain data.

8. **[Ethereum Gravatar](#ethereum-gravatar)**  
   This subgraph indexes data from the Ethereum Gravatar smart contract. Gravatar is a service where users can create and manage globally unique avatars.

9. **[Example Subgraph](#example-subgraph)**  
   This subgraph shows the structure of a minimal subgraph. It provides a generic setup with a simple contract and schema designed to teach the fundamentals of defining, mapping, and querying subgraph data.

10. **[Matic Lens Protocol Posts Subgraph](#matic-lens-protocol-posts-subgraph)**  
    This example demonstrates how to index data from the Lens Protocol deployed on the Polygon (Matic) network.

11. **[NEAR Blocks](#near-blocks)**  
    This subgraph indexes blockchain data from the NEAR Protocol. It listens to block-related events and stores key data such as block number, timestamp, and hash in a queryable format.

12. **[NEAR Receipts](#near-receipts)**  
    This subgraph indexes transaction receipts from the NEAR Protocol. It tracks and stores receipt data such as transaction hash, status, and execution details.

13. **[Substreams Powered Subgraph](#substreams-powered-subgraph)**  
    This is a basic Substreams-powered subgraph, which includes the Substreams definition. It tracks new contract deployments on Ethereum and demonstrates integration with Graph Node using `substreams_entity_change` types and helpers.

To learn more about subgraphs, review [subgraphs]( https://thegraph.com/docs/en/subgraphs/developing/subgraphs/) on [The Graph docs]( https://thegraph.com/docs/en/).


