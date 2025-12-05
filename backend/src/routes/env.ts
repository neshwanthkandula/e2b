import { Router  } from "express";
import { createEnvironment } from "../K8s/createEnv";
import { deleteEnvironment } from "../K8s/deleteEnv";

export const router = Router();

router.post("/create", async (req, res)=>{

    const { userId, projectId} = req.body;
    if(!userId || !projectId){
        return res.status(400).json({
            error : "missing userId or projectId"
        });
    }

    const envId = `${userId}-${projectId}`;
    try {
         const result = await createEnvironment(envId);
        res.json(result);
    }catch(err : any){
        res.status(500).json({ error : err.message})
    }
})

router.post("/delete", async (req, res)=>{
        const { userId, projectId} = req.body;
    if(!userId || !projectId){
        return res.status(400).json({
            error : "missing userId or projectId"
        });
    }

    const envId = `${userId}-${projectId}`;
    try {
         const result = await deleteEnvironment(envId);
        res.json(result);
    }catch(err : any){
        res.status(500).json({ error : err.message})
    }
})