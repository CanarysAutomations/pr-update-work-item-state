# Update work item state when PR is merged

Update work item state in Azure DevOps when the pull request is merged. 

## Prerequisites

- Azure DevOps account
- Azure DevOps PAT
- GitHub Account
- GitHub PAT
- Install the [Azure Boards App](https://docs.microsoft.com/en-us/azure/devops/boards/github/install-github-app?view=azure-devops) from GitHub Marketplace

## Example Usage

Add the following secrets in your repository

- Azure DevOps PAT 
- GitHub PAT
- Azure DevOps Organization 
- Azure DevOps Project

Other Input Parameters

- closedstate
    1. This Parameter is required for the action to check the workitem state. If the target workitem's state is closed, the action will quit. This is to ensure that a closed work item is not linked to a pull request.

- gh_repo,gh_repo_owner
    1. These details are required to get the latest pull request details	

- pull_number
    1. We get the value of this parameter from the GitHub event ${{github.event.number}}

![Alt Text](./assets/gifs/workflow.gif)	

### WorkFlow Process

1. Get the WorkItem Id

   - With the github repository inputs, a request is sent to the pull request api endpoint to get the complete pull request details
   - From the pull request details the work item id is retrieved

2. Update the WorkItem State

   - With the WorkItem and the ADO Project Name, the workitem states associated with the Project are pulled. 
   - At first the check will be done whether the work item is in closed state. If not the workitem state is updated to the next state.

### Linking the WorkItem

The workItem Id must be prefixed with AB and added as AB#[Workitem Id] in the Pull request Body.

![img](./assets/images/pull-request-window.png)
   
### Sample WorkFlow File 

```
name: Sync Pull Request to Azure DevOps work item

on:
   pull_request:
    branches: [master]
    types: [closed]

jobs:
  alert:
    runs-on: ubuntu-latest
    name: Test workflow
    steps:       
    - uses: CanarysAutomations/pr-update-work-item-state@master
      env: 
        gh_token : '${{ secrets.GH_TOKEN }}'   
        ado_token: '${{ secrets.ADO_PERSONAL_ACCESS_TOKEN }}'
        ado_organization: '${{ secrets.ADO_ORGANIZATION }}'
        ado_project: '${{ secrets.ADO_PROJECT }}'
        closedstate: ''
        gh_repo_owner: ''
        gh_repo: ''
        pull_number: ${{github.event.number}} 
```
   




