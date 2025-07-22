const AWS = require("aws-sdk");
const Alexa = require("ask-sdk-core");

const { openai } = require("./api");

const { introScreenApl, responseScreenApl } = require("./apl");
const { getRandomString, getAorAn, removeNarrators } = require("./util");

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
  async handle(handlerInput) {
    const storySubject = Alexa.getSlotValue(
      handlerInput.requestEnvelope,
      "subject"
    );

    console.log(
      `------------------- Got StoryIntent request ------------------- ${storySubject}`
    );
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
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

      console.log(
        "------------------- aiResponse -------------------",
        aiResponse
      );

      let responseBuilder = handlerInput.responseBuilder
        .speak(ssmlSpeech)
        .reprompt("Do you want to hear another story");

      const aplDirective = buildAplResponse(
        handlerInput,
        aiResponse,
        "Super AI",
        ssmlSpeech
      );
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
      "Just ask me a question or anything really! I'll do my best to answer it. What do you want to know?";

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

    console.log(
      `~~~~~~~~~~~~ Session ended with reason: ${reason} ~~~~~~~~~~~~`
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
exports.handler = Alexa.SkillBuilders.custom()
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
  .lambda();
