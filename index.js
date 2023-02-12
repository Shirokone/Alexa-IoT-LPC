const Alexa = require('ask-sdk');
const awsIOT = require('aws-iot-device-sdk');

const data = {
    keyPath: '/opt/nodejs/certs/b735e072e4-private.pem.key',
    certPath: '/opt/nodejs/certs/b735e072e4-certificate.pem.crt',
    caPath: '/opt/nodejs/certs/VeriSign-Class 3-Public-Primary-Certification-Authority-G5.pem',
    clientId: "Lambda",
    host: 'a3owlr9sxet2ck.iot.eu-west-1.amazonaws.com'
  }


  
  const GetTemperatureIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'getTemperature'
    },
    handle(handlerInput) {
        let thingShadows = awsIOT.thingShadow(data)

        return new Promise(resolve => {

            thingShadows.on('connect', ()=>{
                thingShadows.register('thermostat', {}, ()=>{

                  let slots = handlerInput.requestEnvelope.request.intent.slots;
                        let clientToken = thingShadows.get("thermostat")

                        thingShadows.on('status', (thingName, stat, clientToken, stateObject)=> {
                          
                          let speechText = "";
                          let room = "0";

                          if(stat=="accepted"){
                            if(slots.room.resolutions){
                               room = slots.room.resolutions.resolutionsPerAuthority[0].values[0].value.id;
                            } 
                            speechText = "Current temperature is " + stateObject.state.reported[room] + " degrees Celsius";
                          } else {
                            speechText = "You request was rejected";
                          }
                            
                            resolve(
                                handlerInput.responseBuilder
                                .speak(speechText)
                                .getResponse()
                            )
                            thingShadows.end(false, ()=>{})
                          })
                  
                        if (clientTokenUpdate===null){
                          let speechText = "Couldn't acccess thermostat";
      
                          resolve(
                              
                              handlerInput.responseBuilder
                                  .speak(speechText)
                                  .getResponse()
                          )
                      }     



                })
            })


           
        
        })
    }
}

const SetTemperatureIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'setTemperature'
    },
    handle(handlerInput) {
        let thingShadows = awsIOT.thingShadow(data)

        return new Promise(resolve => {

            thingShadows.on('connect', ()=>{
                thingShadows.register('thermostat', {}, ()=>{

                    let tempState = {
                        "state":{
                            "desired":{
                                "temperature": handlerInput.requestEnvelope.request.intent.slots.value.value
                            }
                        }
                    }

                   let clientTokenUpdate = thingShadows.update('thermostat', tempState)

                    if (clientTokenUpdate===null){
                        let speechText = "Couldn't acccess thermostat";
    
                        resolve(
                            
                            handlerInput.responseBuilder
                                .speak(speechText)
                                .getResponse()
                        )
                    }


                })
            })

            thingShadows.on('status', (thingName, stat, clientToken, stateObject)=> {

                thingShadows.end(false, ()=>{
                    let speechText = "New thermostat setpoint was established at " + handlerInput.requestEnvelope.request.intent.slots.value.value;

                    resolve(
                        handlerInput.responseBuilder
                            .speak(speechText)
                            .getResponse()
                    )
                })
            
            
            }) 

        
        })
    }
}

const LightsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'lights'
    },
    handle(handlerInput){
    let thingShadows = awsIOT.thingShadow(data)
       

        return new Promise((resolve,reject) => {

        thingShadows.on('connect', ()=>{

            thingShadows.register('lights', {}, ()=>{

                if(handlerInput.requestEnvelope.request.intent.slots.status.resolutions.resolutionsPerAuthority[0].status.code=="ER_SUCCESS_NO_MATCH"){
                    thingShadows.end(false, ()=>{
                        let speechText = "Please provide valid light status";

                        resolve(
                            
                            handlerInput.responseBuilder
                                .speak(speechText)
                                .getResponse()
                        )
                    })
                } else {
              
                let lightState = {
                    "state": {
                        "desired":{
                            
                        }
                    }
                };
                
                let slots = handlerInput.requestEnvelope.request.intent.slots;
                
                if(slots.room.resolutions){
                    lightState.state.desired[slots.room.resolutions.resolutionsPerAuthority[0].values[0].value.id] = parseInt(slots.status.resolutions.resolutionsPerAuthority[0].values[0].value.id);
                } else {
                    lightState.state.desired["0"]=parseInt(slots.status.resolutions.resolutionsPerAuthority[0].values[0].value.id);
                }

               let clientTokenUpdate = thingShadows.update('lights', lightState)

                if (clientTokenUpdate===null){
                    thingShadows.end(false, ()=>{
                        let speechText = "Couldn't acccess lights";

                        resolve(
                            
                            handlerInput.responseBuilder
                                .speak(speechText)
                                .getResponse()
                        )
                    })
                }
                }
            })
        })

        thingShadows.on('status', (thingName, stat, clientToken, stateObject)=> {

                thingShadows.end(false, ()=>{
                  let speechText = "";
 
                  if(stat=="accepted"){
                     speechText = "Turned lights " + handlerInput
                    .requestEnvelope.request.intent.slots.status.value;
                  } else {
                    speechText = "You request was rejected";
                  }

                    resolve(
                        handlerInput.responseBuilder
                            .speak(speechText)

                            .getResponse()
                    )
                })
            
            
        }) 

    })   
    }
}

exports.handler = Alexa.SkillBuilders.custom().addRequestHandlers(GetTemperatureIntentHandler, SetTemperatureIntentHandler, LightsIntentHandler).lambda();