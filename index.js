
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
        core.setFailed();
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
        const result = await response.json();

        var pulldetails = result.body;
        
        var pullstatus = pullrequeststatus(env)

        var workItemId = pulldetails.substr(4,3);

        if (workItemId === null)
        {
            core.setFailed();
            console.log("unable to find workitem id, please check if workitem is linked to pull request");
            return;

        } else {

            updateworkitem(workItemId,env,pullstatus);

        }

    } catch (err){
        core.setFailed(err.message);
    }
    
    
}

async function pullrequeststatus(env){

    let head = new Headers();
    let secondauth = 'token ' + env.ghtoken;
    head.append ('Authorization', secondauth );
    try {
        const newrequesturl = "https://api.github.com/repos/"+env.ghrepo_owner+"/"+env.ghrepo+"/pulls/"+env.pull_number+"/merge";    
        const pullresponse= await fetch (newrequesturl, {
            method: 'GET', 
            headers:head
        })
        const pullresult = await pullresponse.json();
        var pullstatus =pullresult.status;
        return pullstatus;

    } catch(err){
        core.setFailed();
    }

}

async function updateworkitem(workItemId,env,pullstatus) {

    try {
    
    let authHandler = azdev.getPersonalAccessTokenHandler(env.adoToken);
	let connection = new azdev.WebApi(env.orgUrl, authHandler);
    let client = await connection.getWorkItemTrackingApi();
    var workitem = await client.getWorkItem(workItemId);

    var currentdescr = String (workitem.fields["System.Description"]);
    var currentstate = workitem.fields["System.State"];
    
    var type = await client.getWorkItemType(env.project,String (workitem.fields["System.WorkItemType"]));


    if (currentstate == env.closedstate)
    {
        console.log("WorkItem Cannot be updated");
        core.setFailed();

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
                
                let workItemSaveResult = null;

                let mergestatus = [];
                let newdescription = [];

                if (pullstatus == "204"){
                
                mergestatus = "Linked Pull Request merge is successful";
                newdescription = currentdescr + "<br />" + mergestatus;
                
                
                    let patchDocument = [
                        {
                            op: "add",
                            path: "/fields/System.State",
                            value: newstate
                        },
                        {
                            op: "add",
                            path: "/fields/System.Description",
                            value: newdescription
                        }
                    ];

                workItemSaveResult = await client.updateWorkItem(
                        (customHeaders = []),
                        (document = patchDocument),
                        (id = workItemId),
                        (project = env.project),
                        (validateOnly = false)
                        );
                        
                return workItemSaveResult;

                } else if (pullstatus == "404"){

                    mergestatus = "Pull Request closed without merge";
                    newdescription = currentdescr + "<br />" + mergestatus;

                    let patchDocument = [
                        {
                            op: "add",
                            path: "/fields/System.State",
                            value: currentstate
                        },
                        {
                            op: "add",
                            path: "/fields/System.Description",
                            value: newdescription
                        }
                    ];

                    let workItemSaveResult = null;
                
                    workItemSaveResult = await client.updateWorkItem(
                            (customHeaders = []),
                            (document = patchDocument),
                            (id = workItemId),
                            (project = env.project),
                            (validateOnly = false)
                            );
                    
                    return workItemSaveResult;
                    
                    } else {

                        mergestatus = "Unable to get pull request details";
                        newdescription = currentdescr + "<br />" + mergestatus;

                        let patchDocument = [
                            {
                                op: "add",
                                path: "/fields/System.State",
                                value: currentstate
                            },
                            {
                                op: "add",
                                path: "/fields/System.Description",
                                value: newdescription
                            }
                        ];
    
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

            console.log("Work Item State Updated");

    } catch (err){

        core.setFailed(err.message);

    }
		
	
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



