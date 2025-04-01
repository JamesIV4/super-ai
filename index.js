const AWS = require("aws-sdk");
const Alexa = require("ask-sdk-core");

const { openai } = require("./api");

const { introScreenApl, responseScreenApl } = require("./apl");
const { getRandomString, getAorAn, removeNarrators } = require("./util");

// Story preparation cache - just stores the most recent story
let currentStory = null;

// Cache cleanup - AWS Lambda instances persist between invocations
// This function helps prevent memory leaks by clearing old story
const cleanupStoryCache = () => {
  // If the story is older than 5 minutes, clear it
  if (currentStory && currentStory.timestamp) {
    const currentTime = Date.now();
    const storyAge = currentTime - currentStory.timestamp;

    if (storyAge > 300000) {
      // 5 minutes
      console.log(
        `Cleaning up stale story from ${new Date(
          currentStory.timestamp
        ).toISOString()}`
      );
      currentStory = null;
    }
  }
};

// Background story preparation
const prepareStoryInBackground = async (storySubject) => {
  console.log(`Starting background story preparation for: ${storySubject}`);

  try {
    // Make the OpenAI API call with timeout and retry logic
    let retryCount = 0;
    const maxRetries = 2;
    let completion;

    while (retryCount <= maxRetries) {
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 4096,
          messages: [
            {
              role: "system",
              content: "Tell a one-shot story that is imaginative and fun.",
            },
            { role: "user", content: `Tell ${storySubject}` },
          ],
        });
        break; // If successful, exit the retry loop
      } catch (err) {
        retryCount++;
        if (retryCount > maxRetries) {
          throw err; // If we've exhausted retries, rethrow the error
        }
        console.log(
          `OpenAI API call failed, retrying (${retryCount}/${maxRetries})...`,
          JSON.stringify(err)
        );
        // Wait a moment before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

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

    // Store the prepared story
    currentStory = {
      status: "ready",
      ssmlSpeech,
      textContent: aiResponse,
      error: null,
      timestamp: Date.now(),
      subject: storySubject,
    };

    console.log("Story preparation complete");
  } catch (error) {
    console.error("Error querying OpenAI:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      response: error.response ? JSON.stringify(error.response) : "No response",
    });

    // Update the story with error information
    currentStory = {
      status: "error",
      ssmlSpeech: null,
      textContent: null,
      error: error.message,
      timestamp: Date.now(),
      subject: storySubject,
    };
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

// Story preparation status messages
const storyPreparationMessages = {
  longWait: [
    "Your story is taking longer than expected. <break time='30s'/> Would you like to check if your story is ready now?",
  ],
  mediumWait: [
    "I'm still working on your story. Please wait a little longer. <break time='15s'/> Would you like to check if your story is ready now?",
    "Your story is still coming together. Please wait a little longer. <break time='15s'/> Would you like to check if your story is ready now?",
    "I'm still crafting your story with care. Please wait a little longer. <break time='15s'/> Would you like to check if your story is ready now?",
    "The story is still taking shape. Please wait a little longer. <break time='15s'/> Would you like to check if your story is ready now?",
    "I'm still adding the finishing touches to your story. Please wait a little longer. <break time='15s'/> Would you like to check if your story is ready now?",
  ],
  shortWait: [
    "I'm still preparing your story. Please wait. <break time='15s'/> Would you like to check if your story is ready now?  ",
    "Your story is in the works. Please wait. <break time='15s'/> Would you like to check if your story is ready now?",
    "I'm working on your story. Please wait. <break time='15s'/> Would you like to check if your story is ready now?",
    "The story is being created. Please wait. <break time='15s'/> Would you like to check if your story is ready now?",
    "I'm getting your story ready. Please wait. <break time='15s'/> Would you like to check if your story is ready now?",
  ],
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

    // Initialize the story
    currentStory = {
      status: "preparing",
      ssmlSpeech: null,
      textContent: null,
      error: null,
      timestamp: Date.now(),
      subject: storySubject,
    };

    // Start the background story preparation (completely detached from this handler)
    prepareStoryInBackground(storySubject);

    // Set session attributes to indicate we're waiting for story confirmation
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.awaitingStoryConfirmation = true;
    sessionAttributes.storyError = false;
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

    // Check if we're awaiting story confirmation
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    const awaitingStory = sessionAttributes.awaitingStoryConfirmation || false;

    // If not awaiting a story confirmation, handle as a general "yes"
    if (!awaitingStory) {
      return handlerInput.responseBuilder
        .speak("Ask me another question or request a story.")
        .reprompt("You can ask me a question or request a story.")
        .getResponse();
    }

    // If no story is being prepared
    if (!currentStory) {
      // Clear the flag
      sessionAttributes.awaitingStoryConfirmation = false;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      return handlerInput.responseBuilder
        .speak(
          "I don't have any stories ready. Would you like me to tell you a story?"
        )
        .reprompt("Would you like me to tell you a story?")
        .getResponse();
    }

    // Check the status of the story
    if (currentStory.status === "ready") {
      // Story is ready, deliver it
      console.log(
        "------------------- Delivering prepared story -------------------"
      );

      // Save the story data before clearing it
      const storyToDeliver = Object.assign({}, currentStory);

      // Clear the current story and reset the flag
      currentStory = null;
      sessionAttributes.awaitingStoryConfirmation = false;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      // Deliver the story
      let responseBuilder = handlerInput.responseBuilder
        .speak(storyToDeliver.ssmlSpeech)
        .reprompt("Would you like to hear another story?");

      // Add APL if supported
      const aplDirective = buildAplResponse(
        handlerInput,
        storyToDeliver.textContent,
        "Super AI",
        storyToDeliver.ssmlSpeech
      );

      if (aplDirective) {
        responseBuilder.addDirective(aplDirective);
      }

      return responseBuilder.getResponse();
    } else if (currentStory.status === "error") {
      // There was an error generating the story
      const subject = currentStory.subject || "";

      // Set the error flag in session attributes
      sessionAttributes.storyError = true;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      // Clear the current story and reset the flag
      currentStory = null;
      sessionAttributes.awaitingStoryConfirmation = false;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      return handlerInput.responseBuilder
        .speak(
          `I'm sorry, I had trouble creating your story: tell ${subject}. Please try asking for a story again.`
        )
        .reprompt("Would you like to try asking for a different story?")
        .getResponse();
    } else {
      // Story is still preparing
      const currentTime = Date.now();
      const waitTime = currentTime - currentStory.timestamp;

      if (waitTime > 90000) {
        // More than 90 seconds - give the option to cancel
        return handlerInput.responseBuilder
          .speak(getRandomString(storyPreparationMessages.longWait))
          .reprompt("Would you like to keep waiting?")
          .getResponse();
      } else if (waitTime > 45000) {
        // Between 45-90 seconds
        return handlerInput.responseBuilder
          .speak(getRandomString(storyPreparationMessages.mediumWait))
          .reprompt("Would you like to check if your story ready now?")
          .getResponse();
      } else {
        // Less than 45 seconds
        return handlerInput.responseBuilder
          .speak(getRandomString(storyPreparationMessages.shortWait))
          .reprompt("Would you like to check if your story is ready now?")
          .getResponse();
      }
    }
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

    // Check if we're awaiting story confirmation
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    const awaitingStory = sessionAttributes.awaitingStoryConfirmation || false;

    // Reset the flag
    if (awaitingStory) {
      sessionAttributes.awaitingStoryConfirmation = false;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      // If we have a pending story, clear it
      if (currentStory && currentStory.status === "preparing") {
        const subject = currentStory.subject || "";
        currentStory = null;

        return handlerInput.responseBuilder
          .speak(
            `I've cancelled the story: tell ${subject}. Feel free to ask me for a different story anytime.`
          )
          .reprompt("Would you like to try something else?")
          .getResponse();
      }
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
