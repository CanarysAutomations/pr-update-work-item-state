
const azdev = require(`azure-devops-node-api`);
const core = require(`@actions/core`);
const github = require(`@actions/github`);
const fetch = require("node-fetch");
global.Headers = fetch.Headers;



main();
function main () {
  
    const env = process.env
    const context = github.context; 

    let vm = [];

    vm = getValuesFromPayload(github.context.payload,env);

    console.log(vm);

   if(vm.action == "closed")
   {
      getworkitemid(vm.env);

   } else {
        core.SetFailed();
   }
    
}

async function getworkitemid (env) {

    let h = new Headers();
    let auth = 'token ' + env.ghtoken;
    h.append ('Authorization', auth );
    try {
        const requesturl = "https://api.github.com/repos/"+env.ghrepo_owner+"/"+env.ghrepo+"/pulls/"+env.pull_number;    
        const response= await fetch (requesturl, {
            method: 'GET', 
            headers:h
        })
        console.log(requesturl);
        const result = await response.json();
        console.log(result);

        var pulldetails = result.body;
        var workItemId = pulldetails.substr(4,3);
        getworkitemandupdate(workItemId,env);
    } catch (err){
        core.setFailed();
    }
    
    
}
    
    
    
    

async function getworkitemandupdate(workItemId,env) {
		
	let authHandler = azdev.getPersonalAccessTokenHandler(env.adoToken);
	let connection = new azdev.WebApi(env.orgUrl, authHandler);
    let client = await connection.getWorkItemTrackingApi();
    var workitem = await client.getWorkItem(workItemId);
    var currentstate = workitem.fields["System.State"];
    
    var type = await client.getWorkItemType(env.project,String (workitem.fields["System.WorkItemType"]));


    if (currentstate == env.closedstate)
    {
        console.log("WorkItem Cannot be updated");

    } else {
                var wstateslength = type.states.length;
                var i;
    
                for (i=wstateslength-1;i>=0;i-- )
                {
                    if (currentstate == type.states[i].name)
                    {
                        var j = i;
                        var newstate = type.states[++j].name;
                        
                    } 
                }
                
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

            console.log("Work Item State Updated");
}

function getValuesFromPayload(payload,env)
{
   var vm = {
        action: payload.action != undefined ? payload.action : "",

        env : {
            organization: env.ado_organization != undefined ? env.ado_organization : "",
            orgUrl: env.ado_organization != undefined ? "https://dev.azure.com/" + env.ado_organization : "",
            adoToken: env.ado_token != undefined ? env.ado_token : "",
            project: env.ado_project != undefined ? env.ado_project : "",
            ghrepo_owner: env.gh_repo_owner != undefined ? env.gh_repo_owner :"",
            ghrepo: env.gh_repo != undefined ? env.gh_repo :"",
            pull_number: env.pull_number != undefined ? env.pull_number :"",
            closedstate: env.closedstate != undefined ? env.closedstate :"",
	        ghtoken: env.gh_token != undefined ? env.gh_token :""
        }
    }

    return vm;
}



