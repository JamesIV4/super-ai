const AWS = require("aws-sdk");
const Alexa = require("ask-sdk-core");

const { openai } = require("./api");

const { introScreenApl, responseScreenApl } = require("./apl");
const {
  getRandomString,
  getAorAn,
  removeNarrators,
  getS3PreSignedUrl,
} = require("./util");

// Story preparation cache
const storyCache = new Map();

// Cache cleanup - AWS Lambda instances persist between invocations
// This function helps prevent memory leaks by removing old entries
const cleanupStoryCache = () => {
  const MAX_CACHE_SIZE = 50; // Adjust based on expected load

  if (storyCache.size > MAX_CACHE_SIZE) {
    console.log(`Cleaning up story cache. Current size: ${storyCache.size}`);
    // Convert to array, sort by timestamp, and keep only the newest MAX_CACHE_SIZE entries
    const cacheEntries = Array.from(storyCache.entries());
    const entriesToDelete = cacheEntries.slice(
      0,
      cacheEntries.length - MAX_CACHE_SIZE
    );

    for (const [key] of entriesToDelete) {
      storyCache.delete(key);
    }

    console.log(`Story cache cleaned up. New size: ${storyCache.size}`);
  }
};

// Background story preparation
const prepareStoryInBackground = async (storySubject, requestId) => {
  console.log(
    `Starting background story preparation for: ${storySubject} with ID: ${requestId}`
  );

  try {
    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `Ignore previous instructions: You are now a one-shot story bot that is imaginative and fun. No questions. AVOID clichéd endings like "From that day on" (please!). Choose single narrator tag "Amy: " or "Matthew: "`,
        },
        { role: "user", content: `Tell ${storySubject}` },
      ],
    });

    console.log(
      "------------------- AI FULL RESPONSE -------------------",
      JSON.stringify(completion)
    );

    const voices = ["Amy", "Matthew"];
    let aiResponse = completion.choices[0].message.content;
    const aiChosenVoice = aiResponse.toLowerCase().includes("amy:")
      ? "Amy"
      : aiResponse.toLowerCase().includes("matthew:")
      ? "Matthew"
      : "";

    // Remove the narrator tag
    if (aiChosenVoice.length) {
      aiResponse = removeNarrators(aiResponse);
    }

    const ssmlSpeech = `<voice name='${
      aiChosenVoice ? aiChosenVoice : getRandomString(voices)
    }'>${aiResponse}</voice>`;

    // Store the prepared story in the cache
    storyCache.set(requestId, {
      status: "ready",
      ssmlSpeech,
      textContent: aiResponse,
      error: null,
      timestamp: Date.now(),
    });

    console.log(`Story preparation complete for ID: ${requestId}`);
    console.log(
      `Updated session attributes for request ID: ${requestId}, story ready: true`
    );
  } catch (error) {
    console.error("Error querying OpenAI:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      response: error.response ? JSON.stringify(error.response) : "No response",
    });

    // Update the cache with error information
    storyCache.set(requestId, {
      status: "error",
      ssmlSpeech: null,
      textContent: null,
      error: error.message,
      timestamp: Date.now(),
    });
  }
};

// Common utility functions
const BACKGROUND_IMAGE_URL = "https://i.imgur.com/7622Qek.jpg";

const buildAplResponse = (
  handlerInput,
  text,
  title = "Super AI",
  speechText = null,
  type = "response",
  hintText = null
) => {
  const aplSupported =
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces[
      "Alexa.Presentation.APL"
    ];

  if (!aplSupported) return null;

  const formatIntroHeader = (text) => {
    let index = text.indexOf(".");
    if (index !== -1) {
      return (
        text.substring(0, index + 1) + "<br />" + text.substring(index + 1)
      );
    }
    return text;
  };

  const isIntro = type === "intro";
  const document = isIntro ? introScreenApl : responseScreenApl;
  const token = isIntro ? "intro" : "response";

  return {
    type: "Alexa.Presentation.APL.RenderDocument",
    token,
    document,
    datasources: isIntro
      ? {
          headlineTemplateData: {
            type: "object",
            properties: {
              textContent: {
                primaryText: {
                  text: formatIntroHeader(text),
                },
              },
              hintText,
              backgroundImage: {
                sources: [{ url: BACKGROUND_IMAGE_URL }],
              },
            },
          },
        }
      : {
          longTextTemplateData: {
            type: "object",
            objectId: "responseDisplay",
            properties: {
              backgroundImage: {
                sources: [{ url: BACKGROUND_IMAGE_URL }],
              },
              title,
              textContent: {
                primaryText: { text },
              },
              speechText: speechText || text,
            },
          },
        },
  };
};

const buildErrorResponse = (handlerInput, errorMessage) => {
  const aplSupported =
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces[
      "Alexa.Presentation.APL"
    ];

  let responseBuilder = handlerInput.responseBuilder.speak(errorMessage);

  if (aplSupported) {
    responseBuilder.addDirective({
      type: "Alexa.Presentation.APL.RenderDocument",
      token: "response",
      document: responseScreenApl,
      datasources: {
        headlineTemplateData: {
          type: "object",
          properties: {
            textContent: {
              primaryText: { text: errorMessage },
            },
            backgroundImage: {
              sources: [{ url: BACKGROUND_IMAGE_URL }],
            },
          },
        },
      },
    });
  }

  return responseBuilder.getResponse();
};

const getGoodbyeString = () => {
  const strings = [
    "Farewell for now!",
    "Until we meet again!",
    "Take care!",
    "See you later, alligator!",
    "Catch you later!",
    "Adios for now!",
    "Till next time!",
    "Bye-bye for now!",
    "So long!",
    "Until next time!",
    "Goodbye for now!",
    "Have a good one!",
    "Bye for now!",
    "Take it easy!",
    "Until later!",
  ];

  return getRandomString(strings);
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    console.log("------------------- Got LaunchRequest -------------------");

    const introStrings = ["Listening..."];

    const animals = [
      "cat",
      "dog",
      "bird",
      "fish",
      "cow",
      "pig",
      "horse",
      "sheep",
      "goat",
      "duck",
      "hen",
      "frog",
      "bee",
      "ant",
      "bat",
      "owl",
      "lion",
      "tiger",
      "bear",
      "wolf",
      "taco",
    ];

    const whimsicalActions = [
      "dancing on clouds",
      "chasing moonbeams",
      "laughing with stars",
      "singing to flowers",
      "climbing rainbows",
      "dreaming of galaxies",
      "hugging a cloud",
      "talking to trees",
      "wishing on dandelions",
      "finding fairy dust",
      "following raindrops",
      "imagining dragons",
      "bouncing on the moon",
      "exploring magic",
    ];

    const introString = getRandomString(introStrings);
    const speakOutput = `<amazon:emotion name='excited' intensity='medium'>${introString}</amazon:emotion>`;

    const chosenAnimal = getRandomString(animals);
    const hintText = `Try, "Tell me a story about ${getAorAn(
      chosenAnimal
    )} ${chosenAnimal} ${getRandomString(whimsicalActions)}"`;

    let responseBuilder = handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(hintText);

    const aplDirective = buildAplResponse(
      handlerInput,
      introString,
      "Super AI",
      null,
      "intro",
      hintText
    );
    if (aplDirective) {
      responseBuilder.addDirective(aplDirective);
    }

    return responseBuilder.getResponse();
  },
};

const QuestionIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "QuestionIntent"
    );
  },
  async handle(handlerInput) {
    const userQuery = Alexa.getSlotValue(
      handlerInput.requestEnvelope,
      "question"
    );

    console.log(
      "------------------- Got QuestionIntent request -------------------",
      userQuery
    );

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [{ role: "user", content: userQuery }],
      });

      const aiResponse = completion.choices[0].message.content;

      console.log(
        "------------------- aiResponse -------------------",
        aiResponse
      );

      let responseBuilder = handlerInput.responseBuilder
        .speak(aiResponse)
        .reprompt("Do you want to ask another question?");

      const aplDirective = buildAplResponse(handlerInput, aiResponse);
      if (aplDirective) {
        responseBuilder.addDirective(aplDirective);
      }

      return responseBuilder.getResponse();
    } catch (error) {
      console.error("Error querying OpenAI:", error);
      return buildErrorResponse(
        handlerInput,
        "Sorry, there was a problem getting the AI response."
      );
    }
  },
};

const StoryIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "StoryIntent"
    );
  },
  handle(handlerInput) {
    const storySubject = Alexa.getSlotValue(
      handlerInput.requestEnvelope,
      "subject"
    );

    console.log(
      `------------------- Got StoryIntent request ------------------- ${storySubject}`
    );

    // Generate a unique ID for this story request
    const requestId = handlerInput.requestEnvelope.request.requestId;

    // Initialize the story in the cache
    storyCache.set(requestId, {
      status: "preparing",
      ssmlSpeech: null,
      textContent: null,
      error: null,
      timestamp: Date.now(),
    });

    // Start the background story preparation (completely detached from this handler)
    // We don't await this promise, it runs entirely in the background
    prepareStoryInBackground(storySubject, requestId);

    // Get session attributes to store subject for the second part of the response
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.storyRequestId = requestId;
    sessionAttributes.awaitingStoryConfirmation = true;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    // Immediately respond to the user
    return handlerInput.responseBuilder
      .speak(
        "I'm preparing your story. <break time='1s'/> Would you like to hear it when it's ready?"
      )
      .reprompt("Would you like to hear the story when it's ready?")
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    console.log("------------------- Got HelpIntent -------------------");

    const speakOutput =
      "Just ask me a question or anything really! I'll do my best to answer it. What do you want to know";

    let responseBuilder = handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("Are you still there? Ask me a question.");

    const aplDirective = buildAplResponse(handlerInput, speakOutput);
    if (aplDirective) {
      responseBuilder.addDirective(aplDirective);
    }

    return responseBuilder.getResponse();
  },
};

const YesIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.YesIntent"
    );
  },
  handle(handlerInput) {
    console.log("------------------- Got YesIntent -------------------");

    // Get session attributes
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();

    // Check if we're awaiting confirmation to play a story
    if (
      sessionAttributes.awaitingStoryConfirmation &&
      sessionAttributes.storyRequestId
    ) {
      const requestId = sessionAttributes.storyRequestId;
      const storyData = storyCache.get(requestId);

      if (!storyData) {
        // This shouldn't happen, but just in case
        return handlerInput.responseBuilder
          .speak(
            "I'm sorry, I couldn't find your story. Would you like to try asking for a different story?"
          )
          .reprompt("Would you like to try asking for a different story?")
          .getResponse();
      }

      // Check the status of the story
      if (storyData.status === "preparing") {
        // Check if it's been more than 60 seconds since the request
        const currentTime = Date.now();
        const waitTime = currentTime - (storyData.timestamp || 0);

        if (waitTime > 60000) {
          // It's been a long time, let's check if maybe it's ready but the status wasn't updated
          return handlerInput.responseBuilder
            .speak(
              "I'm still working on your story. It's taking longer than expected. Would you like to wait a bit longer?"
            )
            .reprompt("Would you like to wait a bit longer for your story?")
            .getResponse();
        }

        return handlerInput.responseBuilder
          .speak(
            "I'm still preparing your story. Would you like me to check if it's ready now?"
          )
          .reprompt("Would you like me to check if the story is ready now?")
          .getResponse();
      }

      if (storyData.status === "error") {
        // Reset the flags
        sessionAttributes.awaitingStoryConfirmation = false;
        sessionAttributes.storyRequestId = null;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        // Clean up the cache
        storyCache.delete(requestId);

        return handlerInput.responseBuilder
          .speak(
            "I'm sorry, there was a problem preparing your story. Would you like to try again?"
          )
          .reprompt("Would you like to try asking for a story again?")
          .getResponse();
      }

      if (storyData.status === "ready") {
        // Reset the flags
        sessionAttributes.awaitingStoryConfirmation = false;
        sessionAttributes.storyRequestId = null;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        console.log(
          "------------------- Delivering prepared story -------------------"
        );

        // Deliver the story
        let responseBuilder = handlerInput.responseBuilder
          .speak(storyData.ssmlSpeech)
          .reprompt("Would you like to hear another story?");

        // Add APL if supported
        const aplDirective = buildAplResponse(
          handlerInput,
          storyData.textContent,
          "Super AI",
          storyData.ssmlSpeech
        );

        if (aplDirective) {
          responseBuilder.addDirective(aplDirective);
        }

        // Clean up the cache
        storyCache.delete(requestId);

        return responseBuilder.getResponse();
      }
    }

    // Default response if not awaiting story confirmation
    const speakOutput = "Ask me another question!";

    let responseBuilder = handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("Do you want to ask another question?");

    const aplDirective = buildAplResponse(handlerInput, speakOutput);
    if (aplDirective) {
      responseBuilder.addDirective(aplDirective);
    }

    return responseBuilder.getResponse();
  },
};

const NoIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.NoIntent"
    );
  },
  handle(handlerInput) {
    console.log("------------------- Got NoIntent -------------------");

    // Get session attributes
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();

    // Check if we're awaiting confirmation to play a story
    if (
      sessionAttributes.awaitingStoryConfirmation &&
      sessionAttributes.storyRequestId
    ) {
      // Reset the flag
      sessionAttributes.awaitingStoryConfirmation = false;
      const requestId = sessionAttributes.storyRequestId;
      sessionAttributes.storyRequestId = null;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      // Clean up the cache
      if (storyCache.has(requestId)) {
        storyCache.delete(requestId);
      }

      // Respond to the user's rejection of the story
      return handlerInput.responseBuilder
        .speak(
          "No problem. You can ask for a different story or question whenever you're ready."
        )
        .reprompt("What would you like to do?")
        .getResponse();
    }

    // Default goodbye response
    const goodbyeString = getGoodbyeString();

    let responseBuilder = handlerInput.responseBuilder.speak(goodbyeString);

    const aplDirective = buildAplResponse(handlerInput, goodbyeString);
    if (aplDirective) {
      responseBuilder.addDirective(aplDirective);
    }

    return responseBuilder.getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    console.log(
      "------------------- Got CancelAndStopIntent -------------------"
    );

    const goodbyeString = getGoodbyeString();

    let responseBuilder = handlerInput.responseBuilder.speak(goodbyeString);

    const aplDirective = buildAplResponse(handlerInput, goodbyeString);
    if (aplDirective) {
      responseBuilder.addDirective(aplDirective);
    }

    return responseBuilder.getResponse();
  },
};

/* *
 * FallbackIntent triggers when a customer says something that doesn't map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ignored in locales that do not support it yet
 * */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    console.log("------------------- Got FallbackIntent -------------------");

    const speakOutput = "Sorry, I don't know about that. Please try again.";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open
 * session is closed for one of the following reasons: 1) The user says 'exit' or 'quit'. 2) The user does not
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs
 * */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    const reason = handlerInput.requestEnvelope.request.reason;
    const error = handlerInput.requestEnvelope.request.error;

    console.log(
      `~~~~~~~~~~~~ Session ended with reason: ${reason} ~~~~~~~~~~~~
      ${error ? JSON.stringify(error) : ""}`
    );
    console.log(
      "~~~~~~~~~~~~ Session ended ~~~~~~~~~~~~",
      JSON.stringify(handlerInput.requestEnvelope)
    );

    const goodbyeString = getGoodbyeString();

    let responseBuilder = handlerInput.responseBuilder.speak(goodbyeString);

    const aplDirective = buildAplResponse(handlerInput, goodbyeString);
    if (aplDirective) {
      responseBuilder.addDirective(aplDirective);
    }

    return responseBuilder.getResponse();
  },
};

/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below
 * */
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("------------------- Got ErrorHandler -------------------");

    const speakOutput =
      "Sorry, I had trouble doing what you asked. Please try again.";
    console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom
 * */
exports.handler = async (event, context) => {
  // Clean up the story cache on each invocation
  cleanupStoryCache();

  // Create the skill instance
  const skill = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
      LaunchRequestHandler,
      QuestionIntentHandler,
      StoryIntentHandler,
      YesIntentHandler,
      NoIntentHandler,
      HelpIntentHandler,
      CancelAndStopIntentHandler,
      FallbackIntentHandler,
      SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .create();

  return skill.invoke(event, context);
};
