import immutable from 'immutable';
import { Subgraph, SubgraphOptions } from '../subgraph.js';

export default class CosmosSubgraph implements Subgraph {
  manifest: SubgraphOptions['manifest'];
  resolveFile: SubgraphOptions['resolveFile'];
  protocol: SubgraphOptions['protocol'];

  constructor(options: SubgraphOptions) {
    this.manifest = options.manifest;
    this.resolveFile = options.resolveFile;
    this.protocol = options.protocol;
  }

  validateManifest() {
    return immutable.List();
  }

  handlerTypes() {
    return immutable.List([
      'blockHandlers',
      'eventHandlers',
      'transactionHandlers',
      'messageHandlers',
    ]);
  }
}
