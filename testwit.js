
const azdev = require(`azure-devops-node-api`);
const github = require(`@actions/github`);


main();
async function main () {
  
    let vm = [];

    vm = getValuesFromPayload(env);
	
	update(vm,vm.env);
}

async function update(id,env) {
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
			(id = vm.env.wit_id),
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
            wit_id: env.ado_workitemid != undefined ? env.ado_workitemid :""
        }
    }
}



