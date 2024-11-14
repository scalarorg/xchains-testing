*** Settings ***
Library           Process
Library           OperatingSystem

*** Variables ***
${FAB_COMMAND}    fab bitcoin

*** Test Cases ***
Test Bitcoin Task
    [Documentation]    Test the bitcoin task in fabfile.py
    ${result}=    Run Process    ${FAB_COMMAND}    shell=True    stdout=PIPE    stderr=PIPE
    Log To Console    \n${result.stdout}
    ${rc}=    Set Variable    ${result.rc}
    Should Be True    ${rc} == 0    Bitcoin task should run successfully
