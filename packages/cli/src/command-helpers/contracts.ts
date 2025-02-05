import immutable from 'immutable';
import { NetworksRegistry } from '@pinax/graph-networks-registry';
import debugFactory from '../debug.js';
import fetch from '../fetch.js';
import ABI from '../protocols/ethereum/abi.js';

const logger = debugFactory('graph-cli:contract-service');

export class ContractService {
  constructor(private registry: NetworksRegistry) {}

  private async fetchFromEtherscan(url: string): Promise<any | null> {
    const result = await fetch(url).catch(_error => {
      throw new Error(`Contract API is unreachable`);
    });
    let json: any = {};

    if (result.ok) {
      json = await result.json().catch(error => {
        throw new Error(`Invalid JSON: ${error}`);
      });

      if (json.status === '1') return json;
    }

    logger(
      'Failed to fetch from contract API: [%s] %s (%s)\n%O',
      result.status,
      result.statusText,
      result.url,
      json,
    );
    if (json.message) {
      throw new Error(`${json.message ?? ''} - ${json.result ?? ''}`);
    }
    return null;
  }

  // replace {api_key} with process.env[api_key]
  // return empty string if env var not found
  private applyVars(url: string): string {
    const match = url.match(/\{([^}]+)\}/);
    if (!match) return url;
    const key = match[1];
    return process.env[key] ? url.replace(`{${key}}`, process.env[key]) : '';
  }

  private getEtherscanUrls(networkId: string) {
    const network = this.registry.getNetworkById(networkId);
    if (!network) {
      throw new Error(`Invalid network ${networkId}`);
    }

    return (
      network.apiUrls
        ?.filter(item => ['etherscan', 'blockscout'].includes(item.kind))
        ?.map(item => item.url)
        .map(this.applyVars)
        .filter(Boolean) ?? []
    );
  }

  private getRpcUrls(networkId: string) {
    const network = this.registry.getNetworkById(networkId);
    if (!network) {
      throw new Error(`Invalid network ${networkId}`);
    }

    return network.rpcUrls?.map(this.applyVars).filter(Boolean) ?? [];
  }

  async getABI(ABICtor: typeof ABI, networkId: string, address: string) {
    const urls = this.getEtherscanUrls(networkId);
    const errors: string[] = [];
    if (!urls.length) {
      throw new Error(`No contract API available for ${networkId} in the registry`);
    }
    for (const url of urls) {
      try {
        const json = await this.fetchFromEtherscan(
          `${url}?module=contract&action=getabi&address=${address}`,
        );

        if (json) {
          return new ABICtor('Contract', undefined, immutable.fromJS(JSON.parse(json.result)));
        }
        throw new Error(`no result: ${JSON.stringify(json)}`);
      } catch (error) {
        logger(`Failed to fetch from ${url}: ${error}`);
        errors.push(String(error));
      }
    }

    throw new Error(errors?.[0]);
  }

  async getStartBlock(networkId: string, address: string): Promise<string> {
    const urls = this.getEtherscanUrls(networkId);
    if (!urls.length) {
      throw new Error(`No contract API available for ${networkId} in the registry`);
    }
    for (const url of urls) {
      try {
        const json = await this.fetchFromEtherscan(
          `${url}?module=contract&action=getcontractcreation&contractaddresses=${address}`,
        );

        if (json?.result?.length) {
          if (json.result[0]?.blockNumber) {
            return json.result[0].blockNumber;
          }
          const txHash = json.result[0].txHash;
          const tx = await this.fetchTransactionByHash(networkId, txHash);
          if (!tx?.blockNumber) {
            throw new Error(`no blockNumber: ${JSON.stringify(tx)}`);
          }
          return Number(tx.blockNumber).toString();
        }
        throw new Error(`no result: ${JSON.stringify(json)}`);
      } catch (error) {
        logger(`Failed to fetch start block from ${url}: ${error}`);
      }
    }

    throw new Error(`Failed to fetch deploy contract transaction for ${address}`);
  }

  async getContractName(networkId: string, address: string): Promise<string> {
    const urls = this.getEtherscanUrls(networkId);
    if (!urls.length) {
      throw new Error(`No contract API available for ${networkId} in the registry`);
    }
    for (const url of urls) {
      try {
        const json = await this.fetchFromEtherscan(
          `${url}?module=contract&action=getsourcecode&address=${address}`,
        );

        if (json) {
          const { ContractName } = json.result[0];
          if (ContractName !== '') {
            return ContractName;
          }
        }
        throw new Error(`no result: ${JSON.stringify(json)}`);
      } catch (error) {
        logger(`Failed to fetch from ${url}: ${error}`);
      }
    }

    throw new Error(`Failed to fetch contract name for ${address}`);
  }

  async getFromSourcify(
    ABICtor: typeof ABI,
    networkId: string,
    address: string,
  ): Promise<{ abi: ABI; startBlock: string; name: string } | null> {
    try {
      const network = this.registry.getNetworkById(networkId);
      if (!network) throw new Error(`Invalid network ${networkId}`);

      if (!network.caip2Id.startsWith('eip155'))
        throw new Error(`Invalid chainId, Sourcify API only supports EVM chains`);

      const chainId = network.caip2Id.split(':')[1];
      const url = `https://sourcify.dev/server/files/any/${chainId}/${address}`;
      const json:
        | {
            status: string;
            files: { name: string; path: string; content: string }[];
          }
        | { error: string } = await (
        await fetch(url).catch(error => {
          throw new Error(`Sourcify API is unreachable: ${error}`);
        })
      ).json();

      if (json) {
        if ('error' in json) throw new Error(`Sourcify API error: ${json.error}`);

        let metadata: any = json.files.find(e => e.name === 'metadata.json')?.content;
        if (!metadata) throw new Error('Contract is missing metadata');

        const tx_hash = json.files.find(e => e.name === 'creator-tx-hash.txt')?.content;
        if (!tx_hash) throw new Error('Contract is missing tx creation hash');

        const tx = await this.fetchTransactionByHash(networkId, tx_hash);
        if (!tx?.blockNumber)
          throw new Error(`Can't fetch blockNumber from tx: ${JSON.stringify(tx)}`);

        metadata = JSON.parse(metadata);
        const contractName = Object.values(metadata.settings.compilationTarget)[0] as string;
        return {
          abi: new ABICtor(contractName, undefined, immutable.fromJS(metadata.output.abi)) as ABI,
          startBlock: Number(tx.blockNumber).toString(),
          name: contractName,
        };
      }

      throw new Error(`No result: ${JSON.stringify(json)}`);
    } catch (error) {
      logger(`Failed to fetch from Sourcify: ${error}`);
    }

    return null;
  }

  private async fetchTransactionByHash(networkId: string, txHash: string) {
    const urls = this.getRpcUrls(networkId);
    if (!urls.length) {
      throw new Error(`No JSON-RPC available for ${networkId} in the registry`);
    }
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionByHash',
            params: [txHash],
            id: 1,
          }),
        });

        const json = await response.json();
        if (json.result) {
          return json.result;
        }
        throw new Error(JSON.stringify(json));
      } catch (error) {
        logger(`Failed to fetch tx ${txHash} from ${url}: ${error}`);
      }
    }

    throw new Error(`JSON-RPC is unreachable`);
  }
}
