## How to run the tests

```bash
# Pre-requirements: A Python3 environment named `python_env` in `integration-tests` directory
pip install -r requirements.txt

# Run the tests
robot tests/bitcoin/test_bitcoin.robot --include bitcoin --variable ROBOT_ARGS:tests/bitcoin/robot_args.txt
```
