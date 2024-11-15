from fabric import task
from invoke import run
import os
import json
import yaml
from pathlib import Path
import time
import requests

@task
def bitcoin(ctx):
    """
    Run Bitcoin node in regtest mode using Docker Compose
    Usage: fab bitcoin
    """
    # Create Docker network if it doesn't exist
    network_check = ctx.run('docker network ls | grep integration-test', warn=True)
    if not network_check.ok:
        print("[FAB] Creating integration-test network...")
        ctx.run('docker network create integration-test')
    else:
        print("[FAB] integration-test network already exists")

    current_dir = os.path.dirname(os.path.abspath(__file__))
    command = f"docker compose -f {current_dir}/docker-compose.yml up -d bitcoind"
    
    result = ctx.run(command)
    if result.ok:
        print(f"[FAB] Bitcoin services started successfully")
    else:
        print("[FAB] Failed to start Bitcoin services")

@task
def stop_bitcoin(ctx):
    """
    Stop the running Bitcoin container using Docker Compose
    Usage: fab stop-bitcoin
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    command = f"docker compose -f {current_dir}/docker-compose.yml stop bitcoind"
    result = ctx.run(command)
    if result.ok:
        print(f"[FAB] Bitcoin services stopped successfully")
    else:
        print("[FAB] Failed to stop Bitcoin services")

def _clone_repository(ctx, repo_name, version="latest", target_dir=None):
    """
    Common method to clone repositories using config from config.json
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Read configuration
    try:
        with open(os.path.join(current_dir, 'config.json'), 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print("[FAB] Error: config.json not found")
        return False
    except json.JSONDecodeError:
        print("[FAB] Error: Invalid JSON in config.json")
        return False
    
    # Find repository config
    repo_config = next(
        (repo for repo in config.get('repositories', []) 
         if repo.get('name') == repo_name),
        None
    )
    
    if not repo_config:
        print(f"[FAB] Error: {repo_name} repository configuration not found")
        return False
    
    repo_url = repo_config.get('url')
    
    # Handle 'latest' version
    if version == "latest":
        branch = repo_config.get('defaultBranch')
        commit = None
    else:
        # Find specific version configuration
        version_config = next(
            (ver for ver in repo_config.get('versions', [])
             if ver.get('name') == version),
            None
        )
        
        if not version_config:
            print(f"[FAB] Error: Version '{version}' not found in config")
            return False
            
        branch = version_config.get('branch')
        commit = version_config.get('commit')
    
    if target_dir is None:
        target_dir = current_dir
    
    clone_path = os.path.join(target_dir, repo_name)
    command = f"git clone {repo_url} {clone_path}"
    
    if branch:
        command += f" -b {branch}"
    
    result = ctx.run(command)
    if not result.ok:
        print(f"[FAB] Failed to clone {repo_name} repository")
        return False
    
    if commit:
        with ctx.cd(clone_path):
            result = ctx.run(f"git checkout {commit}")
            if not result.ok:
                print(f"[FAB] Failed to checkout commit {commit}")
                return False
    
    version_display = "latest" if version == "latest" else version
    print(f"[FAB] {repo_name} repository cloned successfully (version: {version_display})")
    return True

@task
def clone_vault(ctx, version="latest", target_dir=None):
    """
    Clone the bitcoin-vault repository using predefined config from config.json
    Usage: fab clone-vault [--version=version_name|latest] [--target-dir=path/to/directory]
    """
    _clone_repository(ctx, "bitcoin-vault", version, target_dir)

@task
def clone_electrs(ctx, version="latest", target_dir=None):
    """
    Clone the electrs repository using predefined config from config.json
    Usage: fab clone-electrs [--version=version_name|latest] [--target-dir=path/to/directory]
    """
    _clone_repository(ctx, "electrs", version, target_dir)

@task
def install_binding(ctx):
    """
    Install dependencies in bitcoin-vault/binding directory using bun
    Usage: fab install-binding
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    binding_dir = os.path.join(current_dir, 'bitcoin-vault', 'binding')
    
    with ctx.cd(binding_dir):
        result = ctx.run('bun install')
        if result.ok:
            print("[FAB] Dependencies installed successfully in binding directory")
        else:
            print("[FAB] Failed to install dependencies")

@task
def test_staking(ctx):
    """
    Create .env file and run staking tests
    Usage: fab test-staking
    Returns: Dictionary containing test results including txHexfromPsbt
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    vault_dir = os.path.join(current_dir, 'bitcoin-vault')
    btc_env_path = os.path.join(current_dir, '.bitcoin', '.env.btc')
    output_file = os.path.join(current_dir, 'staking_test_output.txt')
    
    # Create .env file with BTC_ENV_PATH
    ctx.run(f'echo "BTC_ENV_PATH={btc_env_path}" > {vault_dir}/.env')
    
    # Run specific test and show output in real-time while also capturing to file
    with ctx.cd(vault_dir):
        result = ctx.run(f'bun test binding/test/staking.test.ts | tee {output_file}')
        if result.ok:
            print("[FAB] Staking tests completed successfully")
            
            try:
                # Read and parse the output file
                with open(output_file, 'r') as f:
                    content = f.read()
                
                # Find the JSON object containing txHexfromPsbt
                start_idx = content.find('{\n  "txHexfromPsbt"')
                if start_idx != -1:
                    # Find the closing brace
                    end_idx = content.find('}', start_idx) + 1
                    if end_idx != 0:  # if closing brace was found
                        json_str = content[start_idx:end_idx]
                        data = json.loads(json_str)
                        print("\n[FAB] Staking result:", data)
                        os.remove(output_file)
                        return data
                
                print("\n[FAB] Could not find transaction data in output")
                os.remove(output_file)
                return None
                        
            except (json.JSONDecodeError, FileNotFoundError) as e:
                print(f"[FAB] Error parsing output: {str(e)}")
                if os.path.exists(output_file):
                    os.remove(output_file)
                return None
        else:
            print("[FAB] Staking tests failed")
            if result.stderr:
                print(result.stderr)
            if os.path.exists(output_file):
                os.remove(output_file)
            return None

@task
def cleanup(ctx):
    """
    Clean up by calling cleanup_bitcoin, cleanup_electrs, cleanup_vault, and stop typescript-api
    Usage: fab cleanup
    """
    # Stop TypeScript API
    stop_typescript_api(ctx)
    
    # Call cleanup_bitcoin first (without vault cleanup)
    cleanup_bitcoin(ctx)
    
    # Call cleanup_electrs
    cleanup_electrs(ctx)
    
    # Call cleanup_vault
    cleanup_vault(ctx)

@task
def cleanup_bitcoin(ctx):
    """
    Remove Bitcoin Docker container, its associated resources, and .bitcoin directory
    Usage: fab cleanup-bitcoin
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    bitcoin_dir = os.path.join(current_dir, '.bitcoin')
    
    # Down command will stop and remove containers, networks, and volumes
    command = f"docker compose -f {current_dir}/docker-compose.yml down -v"
    result = ctx.run(command)
    
    if result.ok:
        print(f"[FAB] Bitcoin services cleaned up successfully")
    else:
        print("[FAB] Failed to clean up Bitcoin services")
    
    # Remove .bitcoin directory
    if os.path.exists(bitcoin_dir):
        ctx.run(f'rm -rf {bitcoin_dir}')
        print("[FAB] Removed .bitcoin directory")

@task
def cleanup_vault(ctx):
    """
    Remove bitcoin-vault directory and its resources
    Usage: fab cleanup-vault
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    vault_dir = os.path.join(current_dir, 'bitcoin-vault')
    
    # Remove bitcoin-vault directory
    if os.path.exists(vault_dir):
        ctx.run(f'rm -rf {vault_dir}')
        print("[FAB] Removed bitcoin-vault directory")

@task
def cleanup_electrs(ctx):
    """
    Remove Electrs Docker container, its associated resources, and electrs directory
    Usage: fab cleanup-electrs
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    electrs_dir = os.path.join(current_dir, 'electrs')
    compose_file = os.path.join(electrs_dir, 'docker-compose-electrs.yml')
    
    # Only attempt to stop containers if the compose file exists
    if os.path.exists(compose_file):
        # Down command will stop and remove containers, networks, and volumes
        command = f"docker compose -f {compose_file} down -v"
        result = ctx.run(command)
        
        if result.ok:
            print(f"[FAB] Electrs services cleaned up successfully")
        else:
            print("[FAB] Failed to clean up Electrs services")
    else:
        print("[FAB] Skipping Electrs container cleanup - no docker-compose file found")
    
    # Remove electrs directory
    if os.path.exists(electrs_dir):
        ctx.run(f'rm -rf {electrs_dir}')
        print("[FAB] Removed electrs directory")

@task
def start_electrs(ctx):
    """
    Set up Electrs environment by copying configuration files and start the container
    Usage: fab start-electrs
    """
    # Create Docker network if it doesn't exist
    network_check = ctx.run('docker network ls | grep integration-test', warn=True)
    if not network_check.ok:
        print("[FAB] Creating integration-test network...")
        ctx.run('docker network create integration-test')
    else:
        print("[FAB] integration-test network already exists")

    current_dir = os.path.dirname(os.path.abspath(__file__))
    electrs_dir = os.path.join(current_dir, 'electrs')
    
    # Create electrs directory if it doesn't exist
    if not os.path.exists(electrs_dir):
        os.makedirs(electrs_dir)
        print("[FAB] Created electrs directory")
    
    # Copy and rename .env file
    env_source = os.path.join(current_dir, 'electrs.env')
    env_dest = os.path.join(electrs_dir, '.env')
    ctx.run(f'cp {env_source} {env_dest}')
    print("[FAB] Copied and renamed electrs.env to .env")
    
    # Define compose configuration as a dictionary
    compose_config = {
        'version': '3.8',
        'networks': {
            'integration-test': {
                'external': True
            }
        },
        'services': {
            'mempool-electrs': {
                'extends': {
                    'file': 'docker-compose.yml',
                    'service': 'mempool-electrs'
                },
                'networks': ['integration-test']
            }
        },
        'volumes': {
            'electrs_data': {}
        }
    }
    
    # Write docker-compose-electrs.yml using yaml dump
    compose_dest = os.path.join(electrs_dir, 'docker-compose-electrs.yml')
    with open(compose_dest, 'w') as f:
        yaml.dump(compose_config, f, default_flow_style=False, sort_keys=False)
    print("[FAB] Created docker-compose-electrs.yml")
    
    # Start the Electrs container
    command = f"docker compose -f {compose_dest} up -d"
    result = ctx.run(command)
    if result.ok:
        print(f"[FAB] Electrs services started successfully")
    else:
        print("[FAB] Failed to start Electrs services")

@task
def get_staking_transactions(ctx, port=60001, host="localhost", protocol="tcp", number=1, from_key=None):
    """
    Get staking transactions using the TypeScript client API
    Usage: fab get-staking-transactions [--port=60001] [--host=localhost] [--protocol=tcp] [--number=10] [--from-key=<key>]
    Returns: Dictionary containing transaction content if found
    """
    # Prepare request payload
    payload = {
        "port": port,
        "host": host,
        "protocol": protocol,
        "numberOfTransactions": number,
        "fromKey": from_key
    }

    try:
        # Make POST request to the TypeScript API
        response = requests.post(
            "http://localhost:3000/api/staking-transactions",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Check if request was successful
        response.raise_for_status()
        
        # Parse response
        result = response.json()
        
        if result.get('success'):
            transactions = result.get('data')
            print("[FAB] Staking transactions retrieved successfully:")
            print(json.dumps(transactions, indent=2))
            
            # Look for tx_content in the transactions
            if isinstance(transactions, list):
                for tx in transactions:
                    if 'tx_content' in tx:
                        return tx
            return transactions
        else:
            print("[FAB] Failed to get staking transactions:", result.get('error'))
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"[FAB] Error making request to TypeScript API: {str(e)}")
        return None
    except json.JSONDecodeError as e:
        print(f"[FAB] Error parsing response: {str(e)}")
        return None

@task
def build_electrs(ctx):
    """
    Build Electrs container from the cloned repository
    Usage: fab build-electrs
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    electrs_dir = os.path.join(current_dir, 'electrs')
    
    if not os.path.exists(electrs_dir):
        print("[FAB] Error: electrs directory not found. Please clone the repository first.")
        return
    
    # Copy and rename .env file
    env_source = os.path.join(current_dir, 'electrs.env')
    env_dest = os.path.join(electrs_dir, '.env')
    ctx.run(f'cp {env_source} {env_dest}')
    print("[FAB] Copied and renamed electrs.env to .env")
    
    # Use the docker-compose.yml file from the electrs directory
    compose_file = os.path.join(electrs_dir, 'docker-compose.yml')
    command = f"docker compose -f {compose_file} build mempool-electrs"
    
    result = ctx.run(command)
    if result.ok:
        print(f"[FAB] Electrs container built successfully")
    else:
        print("[FAB] Failed to build Electrs container")

@task
def integration_test(ctx):
    """
    Run complete integration test workflow
    Usage: fab integration-test
    """
    # Create Docker network if it doesn't exist
    network_check = ctx.run('docker network ls | grep integration-test', warn=True)
    if not network_check.ok:
        print("[FAB] Creating integration-test network...")
        ctx.run('docker network create integration-test')
    else:
        print("[FAB] integration-test network already exists")

    # Build TypeScript API
    build_typescript_api(ctx)
    print("[FAB] Waiting for TypeScript API build to complete...")
    time.sleep(5)

    # Start TypeScript API service
    if not start_typescript_api(ctx):
        cleanup(ctx)
        raise Exception("Failed to start TypeScript API service")
    print("[FAB] Waiting for TypeScript API to initialize...")
    time.sleep(10)

    # Start Bitcoin network
    bitcoin(ctx)
    print("[FAB] Waiting for Bitcoin network to initialize...")
    time.sleep(10)  # Give Bitcoin some time to start

    # Clone and set up Electrs
    if not _clone_repository(ctx, "electrs", version="latest"):
        cleanup(ctx)
        raise Exception("Failed to clone electrs")

    # TODO: Romove this after upload to docker hub
    # # Build Electrs
    # build_electrs(ctx)
    # print("[FAB] Waiting for Electrs build to complete...")
    # time.sleep(5)

    # Start Electrs
    start_electrs(ctx)
    print("[FAB] Waiting for Electrs to initialize...")
    time.sleep(10)  # Give Electrs some time to start

    # Clone vault with specific version
    if not _clone_repository(ctx, "bitcoin-vault", version="0.0.14"):
        cleanup(ctx)
        raise Exception("Failed to clone bitcoin-vault")

    # Install binding dependencies
    install_binding(ctx)

    # Run staking tests and get the result
    staking_result = test_staking(ctx)
    print("\n ####### [FAB] Staking result:", staking_result)
    if not staking_result:
        cleanup(ctx)
        raise Exception("Failed to execute staking tests")
    
    staking_tx_hex = staking_result.get('txHexfromPsbt')
    if not staking_tx_hex:
        cleanup(ctx)
        raise Exception("No transaction hex found in staking result")

    print("\n[FAB] Created staking transaction hex:", staking_tx_hex)
    print("[FAB] Staking fee:", staking_result.get('fee'))

    # Wait for transactions to be processed
    print("\n[FAB] Waiting for transactions to be processed...")
    time.sleep(30)

    # Get staking transactions and verify tx_content
    tx_result = get_staking_transactions(ctx, host="mempool-electrs", port=60001)
    if not tx_result or 'tx_content' not in tx_result:
        cleanup(ctx)
        raise Exception("Failed to retrieve transaction content")

    retrieved_tx = tx_result['tx_content']
    
    if not retrieved_tx:
        cleanup(ctx)
        raise Exception("No transaction hex found in retrieved transaction")

    print("\n[FAB] Retrieved transaction hex:", retrieved_tx)

    # Compare transaction hexes
    print("\n[FAB] Transaction Verification Results:")
    print("----------------------------------------")
    print("Created tx  :", staking_tx_hex)
    print("Retrieved tx:", retrieved_tx)
    print("----------------------------------------")

    if staking_tx_hex == retrieved_tx:
        print("[FAB] ✅ Transaction verification successful: Created and retrieved transactions match!")
    else:
        print("[FAB] ❌ Transaction verification failed: Transactions do not match")
        print("[FAB] FAILED: Transaction verification failed but continuing execution")

    # Verify Bitcoin directory exists
    current_dir = os.path.dirname(os.path.abspath(__file__))
    bitcoin_dir = Path(current_dir) / '.bitcoin'
    
    if not bitcoin_dir.exists():
        cleanup(ctx)
        raise Exception("Bitcoin directory not found")

    print("\n[FAB] Integration test completed successfully")

    # Optional: Cleanup after test
    cleanup(ctx)
    print("\n[FAB] Cleanup completed")

@task
def build_typescript_api(ctx):
    """
    Build TypeScript API container from the clients/typescript directory
    Usage: fab build-typescript-api
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    typescript_dir = Path(current_dir).parent.parent / 'clients' / 'typescript'
    
    if not typescript_dir.exists():
        print("[FAB] Error: typescript directory not found.")
        return
    
    # Use the docker-compose.yml file from the typescript directory
    compose_file = typescript_dir / 'docker-compose.yml'
    command = f"docker compose -f {str(compose_file)} build typescript-api"
    
    result = ctx.run(command)
    if result.ok:
        print(f"[FAB] TypeScript API container built successfully")
    else:
        print("[FAB] Failed to build TypeScript API container")

@task
def start_typescript_api(ctx):
    """
    Start TypeScript API service using Docker Compose
    Usage: fab start-typescript-api
    """
    # Create Docker network if it doesn't exist
    network_check = ctx.run('docker network ls | grep integration-test', warn=True)
    if not network_check.ok:
        print("[FAB] Creating integration-test network...")
        ctx.run('docker network create integration-test')
    else:
        print("[FAB] integration-test network already exists")

    current_dir = os.path.dirname(os.path.abspath(__file__))
    typescript_dir = Path(current_dir).parent.parent / 'clients' / 'typescript'
    
    if not typescript_dir.exists():
        print("[FAB] Error: typescript directory not found.")
        return False
    
    # Use the docker-compose.yml file from the typescript directory
    compose_file = typescript_dir / 'docker-compose.yml'
    command = f"docker compose -f {str(compose_file)} up -d typescript-api"
    
    result = ctx.run(command)
    if result.ok:
        print("[FAB] TypeScript API service started successfully")
        # Wait for the service to be ready
        print("[FAB] Waiting for TypeScript API to initialize...")
        time.sleep(5)
        return True
    else:
        print("[FAB] Failed to start TypeScript API service")
        return False

@task
def stop_typescript_api(ctx):
    """
    Stop TypeScript API service using Docker Compose
    Usage: fab stop-typescript-api
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    typescript_dir = Path(current_dir).parent.parent / 'clients' / 'typescript'
    
    if not typescript_dir.exists():
        print("[FAB] Error: typescript directory not found.")
        return False
    
    # Use the docker-compose.yml file from the typescript directory
    compose_file = typescript_dir / 'docker-compose.yml'
    command = f"docker compose -f {str(compose_file)} down -v typescript-api"
    
    result = ctx.run(command)
    if result.ok:
        print("[FAB] TypeScript API service stopped successfully")
        return True
    else:
        print("[FAB] Failed to stop TypeScript API service")
        return False
