#!/usr/bin/env node

//console.log('v1', process.argv, process.cwd(), process.env);

const jsforce = require('jsforce');
const sfbulk = require('node-sf-bulk2');
const util = require('util');
const fs = require('fs');
const fsPromises = require('fs').promises


async function submitBulkQueryJob() {
    if (process.env.username && process.env.password) {
        const conn = new jsforce.Connection({loginUrl : 'https://test.salesforce.com', accessToken: process.env.accessToken});
        //await conn.login(process.env.username, process.env.password);
        const bulkconnect = {
            'accessToken': conn.accessToken,
            'apiVersion': '51.0',
            'instanceUrl': process.env.instanceUrl
        };
        try {
            const bulkapi2 = new sfbulk.BulkAPI2(bulkconnect);
            const queryInput = {
                'query': process.argv[2],
                'operation': 'query'
            };
            var response = await bulkapi2.submitBulkQueryJob(queryInput)
            while(response.state !== 'JobComplete'){
                response = await bulkapi2.getBulkQueryJobInfo(response.id)
            }
            const jobQuery = {
                'jobId': response.id
            }
            console.group()
            console.log(`query: ${process.argv[2]}`)
            console.log(response)
            console.groupEnd()
            await fsPromises.writeFile('./results_' + response.object + response.id + '.log', `query: ${process.argv[2]}
`)
            await fsPromises.appendFile('./results_' + response.object + response.id + '.log', JSON.stringify(response, null, 4))
            const result = await bulkapi2.getBulkQueryResults(response.id)
            await fsPromises.writeFile('./results_' + response.object + response.id + '.csv', result.data)
        } catch (ex) {
            console.log(ex);
        }
    } else {
        throw 'set environment variable with your orgs username and password'
    }
}

submitBulkQueryJob()