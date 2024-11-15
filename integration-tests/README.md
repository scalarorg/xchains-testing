## How to run the tests

```bash
# Pre-requirements: A Python3 environment named `python_env` in `integration-tests` directory
# If you don't have it, you can install it using the script in the `install_pyenv.sh` file, as stated below
pip install -r requirements.txt

# Check the list of available fabric tasks
fab --list

# Run the tests
fab integration-tests
```

## Script for installing pyenv

First, make the script executable:

```bash
chmod +x install_pyenv.sh
```

Then run it:

```bash
./install_pyenv.sh
```

Also, restart the terminal

## Scripts for creating a virtual environment

```bash
pyenv install 3.11
pyenv local 3.11
python -m venv python_env
source python_env/bin/activate

# Deactivate the virtual environment
deactivate
```
