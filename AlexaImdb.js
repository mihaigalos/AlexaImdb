

var https = require('https');
var queryString = require('querystring');

// Lambda function:
exports.handler = function (event, context) {

    console.log('Running event');
    
   
};

function getMovieInfo(movieName, callback) {
 
 

 
  var message = {    };
   var messageString = queryString.stringify(message);
 
  var options = {
        host: 'www.omdbapi.com',
        path: '/?t=' + movieName.replace(" ","+") + '&y=&plot=short&r=json',
        method: 'GET'
        
    };
    
    var req = https.request(options, function (res) {
    
    res.setEncoding('utf-8');
          
    // Collect response data as it comes back.
    var responseString = '';
    res.on('data', function (data) {
        responseString += data;
    });
    
    // Log the responce received from Twilio.
    // Or could use JSON.parse(responseString) here to get at individual properties.
    res.on('end', function () {
        console.log('OMDd Response: ' + responseString);
        
        var parsedResponse = JSON.parse(responseString);
    	
    	var sessionAttributes = {};
    	var cardTitle = "MovieTitle";
    	var speechOutput = "Ok. "+movieName+"'s rating is "+parsedResponse.imdbRating;
    	actors = parsedResponse.Actors;
    	actor1 = actors.split(",")[0];
    	actor2 = actors.split(",")[1];
    	speechOutput +=" . It was released on "+parsedResponse.Released+". Starring"+actor1+" and "+actor2+". Here's the plot: "+parsedResponse.Plot;
    	
    	var repromptText = "";
    	var shouldEndSession = true;
    	
    
    	
    
    	callback(sessionAttributes,
    			 buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    	
    	
    });
    });
    
    // Handler for HTTP request errors.
    req.on('error', function (e) {
    console.error('HTTP error: ' + e.message);
    
    var sessionAttributes = {};
    	var cardTitle = "MovieTitle";
    	var speechOutput = "Unfortunately, request has finished with errors.";
    	
    	var repromptText = "";
    	var shouldEndSession = true;
    
    	callback(sessionAttributes,
    			 buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    
    });
    
   
    console.log('OMDd API call.' + messageString);
    req.write(messageString);
    req.end();
}



// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
         }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
            ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
            ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
   
  
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
            ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    
    if("getMovie" === intentName){
        console.log("received getMovie intent.");
        console.log("slots: "+ JSON.stringify(intentRequest.intent.slots, null, 4)  );
        
          var movieName =  intentRequest.intent.slots.Text.value;
                            
        console.log("Requested Movie name : "+ movieName);
        
        getMovieInfo(movieName, callback);
        
        
  
    } else {
        throw "Invalid intent";
    }
    
 
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
            ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------



function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "get the name of a movie you want";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me what action to undertake. ";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}