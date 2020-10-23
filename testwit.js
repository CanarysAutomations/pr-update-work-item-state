
const azdev = require(`azure-devops-node-api`);
const github = require(`@actions/github`);
const fetch = require("node-fetch");
global.Headers = fetch.Headers;
const btoa = require('btoa');


main();
async function main () {
  
    const env = process.env
    const context = github.context; 

    let vm = [];

    vm = getValuesFromPayload(github.context.payload,env);

    if(vm.action == "closed")
    {
        getworkitemid(env);

    } else {
        core.SetFailed();
    }
    
}

async function getworkitemid (env) {

    let h = new Headers();
    let auth = 'token ' + env.gh_token;
    h.append ('Authorization', auth );

    const requesturl = "https://api.github.com/repos/"+env.gh_repo_owner+"/"+env.gh_repo+"/pulls/"+env.pull_number;    
    const response= await fetch (requesturl, {
        method: 'GET', 
        headers:h
    })
    console.log(requesturl);
    const result = await response.json();
    console.log(result);
    var pulldetails = result.body;
    console.log(pulldetails);
    var workItemId = pulldetails.substr(4,3);
    getworkitemandupdate(workItemId,vm.env);
    
    }

async function getworkitemandupdate(workItemId,env) {
		
	let authHandler = azdev.getPersonalAccessTokenHandler(env.adoToken);
	let connection = new azdev.WebApi(env.orgUrl, authHandler);
    let client = await connection.getWorkItemTrackingApi();
    var workitem = await client.getWorkItem(workItemId);
    var currentstate = workitem.fields["System.State"];
    
    var type = await client.getWorkItemType(project,String (workitem.fields["System.WorkItemType"]));


    if (currentstate == env.closedstate)
    {
        console.log("WorkItem Cannot be updated");

    } else {
                let i = 0;
                
                var newstate = type.states[++i].name;    

                let patchDocument = [];

                patchDocument.push({
                        op: "add",
                        path: "/fields/System.State",
                        value: newstate
                    });
                

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


}

function getValuesFromPayload(payload,env)
{
    vm = {
        action: payload.action != undefined ? payload.action : "",

        env : {
            organization: env.ado_organization != undefined ? env.ado_organization : "",
            orgUrl: env.ado_organization != undefined ? "https://dev.azure.com/" + env.ado_organization : "",
            adoToken: env.ado_token != undefined ? env.ado_token : "",
            project: env.ado_project != undefined ? env.ado_project : "",
            newstate: env.ado_newstate != undefined ? env.ado_newstate : "",
            wit_id: env.ado_workitemid != undefined ? env.ado_workitemid :"",
            ghrepo_owner: env.gh_repo_owner != undefined ? env.gh_repo_owner :"",
            ghrepo: env.gh_repo != undefined ? env.gh_repo :"",
            pull_number: env.pull_number != undefined ? env.pull_number :"",
	        ghtoken: env.gh_token != undefined ? env.gh_token :""
        }
    }
}



