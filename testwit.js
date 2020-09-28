
const azdev = require(`azure-devops-node-api`);
const github = require(`@actions/github`);
const fetch = require("node-fetch");


main();
async function main () {
  
    let vm = [];

    vm = getValuesFromPayload(env);

	getworkitemid(env);
    
}

async function getworkitemid (env) {

    const requesturl = "https://api.github.com/repos/"+env.gh_repo_owner+"/"+env.gh_repo+"/pulls/"+env.pull_number;    
    const response = await fetch (requesturl)
    const result =await response.json()
    
    var pulldetails = result.body;
    
    var workItemId = pulldetails.substr(4,3);
    
    update(workItemId,vm.env);
    
    }

async function update(workItemId,env) {
    let patchDocument = [];

    patchDocument.push({
			op: "add",
			path: "/fields/System.State",
			value: env.newstate
		});
		
	let authHandler = azdev.getPersonalAccessTokenHandler(env.adoToken);
	let connection = new azdev.WebApi(env.orgUrl, authHandler);
	let client = await connection.getWorkItemTrackingApi();
	let workItemSaveResult = null;
	
	workItemSaveResult = await client.updateWorkItem(
			(customHeaders = []),
			(document = patchDocument),
			(id = workItemId),
			(project = env.project),
			(validateOnly = false)
			);
			
    return workItemSaveResult;

}

function getValuesFromPayload(env)
{
    vm = {
        env : {
            organization: env.ado_organization != undefined ? env.ado_organization : "",
            orgUrl: env.ado_organization != undefined ? "https://dev.azure.com/" + env.ado_organization : "",
            adoToken: env.ado_token != undefined ? env.ado_token : "",
            project: env.ado_project != undefined ? env.ado_project : "",
            newstate: env.ado_newstate != undefined ? env.ado_newstate : "",
            wit_id: env.ado_workitemid != undefined ? env.ado_workitemid :"",
            ghrepo_owner: env.gh_repo_owner != undefined ? env.gh_repo_owner :"",
            ghrepo: env.gh_repo != undefined ? env.gh_repo :"",
            pull_number: env.pull_number != undefined ? env.pull_number :""
        }
    }
}



