from fabric import task
from invoke import run
import os
import json
import yaml

@task
def bitcoin(ctx):
    """
    Run Bitcoin node in regtest mode using Docker Compose
    Usage: fab bitcoin
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    command = f"docker compose -f {current_dir}/compose.yml up -d bitcoind"
    
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
    command = f"docker compose -f {current_dir}/compose.yml stop bitcoind"
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
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    vault_dir = os.path.join(current_dir, 'bitcoin-vault')
    btc_env_path = os.path.join(current_dir, '.bitcoin', '.env.btc')
    
    # Create .env file with BTC_ENV_PATH
    ctx.run(f'echo "BTC_ENV_PATH={btc_env_path}" > {vault_dir}/.env')
    
    # Run specific test
    with ctx.cd(vault_dir):
        result = ctx.run('bun test binding/test/staking.test.ts')
        if result.ok:
            print("[FAB] Staking tests completed successfully")
        else:
            print("[FAB] Staking tests failed")

@task
def cleanup(ctx):
    """
    Clean up .bitcoin and bitcoin-vault directories
    Usage: fab cleanup
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    bitcoin_dir = os.path.join(current_dir, '.bitcoin')
    vault_dir = os.path.join(current_dir, 'bitcoin-vault')
    
    # Call cleanup_bitcoin first
    cleanup_bitcoin(ctx)
    
    # Remove .bitcoin directory
    if os.path.exists(bitcoin_dir):
        ctx.run(f'rm -rf {bitcoin_dir}')
        print("[FAB] Removed .bitcoin directory")
    
    # Remove bitcoin-vault directory
    if os.path.exists(vault_dir):
        ctx.run(f'rm -rf {vault_dir}')
        print("[FAB] Removed bitcoin-vault directory")

@task
def cleanup_bitcoin(ctx):
    """
    Remove Bitcoin Docker container and its associated resources using Docker Compose
    Usage: fab cleanup-bitcoin
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Down command will stop and remove containers, networks
    command = f"docker compose -f {current_dir}/compose.yml down bitcoind"
    result = ctx.run(command)
    
    if result.ok:
        print(f"[FAB] Bitcoin services cleaned up successfully")
    else:
        print("[FAB] Failed to clean up Bitcoin services")

@task
def electrs(ctx):
    """
    Run Electrs node using Docker Compose
    Usage: fab electrs
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    command = f"docker compose -f {current_dir}/compose.yml up -d mempool-electrs"
    
    result = ctx.run(command)
    if result.ok:
        print(f"[FAB] Electrs services started successfully")
    else:
        print("[FAB] Failed to start Electrs services")

@task
def stop_electrs(ctx):
    """
    Stop the running Electrs container using Docker Compose
    Usage: fab stop-electrs
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    command = f"docker compose -f {current_dir}/compose.yml stop mempool-electrs"
    result = ctx.run(command)
    if result.ok:
        print(f"[FAB] Electrs services stopped successfully")
    else:
        print("[FAB] Failed to stop Electrs services")

@task
def start_electrs(ctx):
    """
    Set up Electrs environment by copying configuration files and start the container
    Usage: fab start-electrs
    """
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
def cleanup_electrs(ctx):
    """
    Remove Electrs Docker container and its associated resources using Docker Compose
    Usage: fab cleanup-electrs
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    electrs_dir = os.path.join(current_dir, 'electrs')
    compose_file = os.path.join(electrs_dir, 'docker-compose-electrs.yml')
    
    # Down command will stop and remove containers, networks
    command = f"docker compose -f {compose_file} down"
    result = ctx.run(command)
    
    if result.ok:
        print(f"[FAB] Electrs services cleaned up successfully")
    else:
        print("[FAB] Failed to clean up Electrs services")
