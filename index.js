const Alexa = require("ask-sdk-core");

const { openai } = require("./api");

const { introScreenApl, responseScreenApl } = require("./apl");
const {
  getRandomString,
  getAorAn,
  removeNarrators,
  extractText,
  logRequestContext,
  logError,
} = require("./util");

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

/* ===== Hybrid routing with one handler for all single-word intents ===== */
/* Intent name -> trigger word */
const INTENT_TRIGGER_MAP = {
  WhatsIntent: "what's",
  LookIntent: "look",
  FindIntent: "find",
  AreIntent: "are",
  AmIntent: "am",
  ShouldIntent: "should",
  ExplainIntent: "explain",
  WhichIntent: "which",
  DoesIntent: "does",
  CanIntent: "can",
  HowIntent: "how",
  IsIntent: "is",
  WhereIntent: "where",
  WhoIntent: "who",
  WhatIntent: "what",
  AskIntent: "ask",
  HiIntent: "hi",
  HelloIntent: "hello",
  HeyIntent: "hey",
  YoIntent: "yo",
  HiyaIntent: "hiya",
  SupIntent: "sup",
  HowdyIntent: "howdy",
  GreetingsIntent: "greetings",
  OkayIntent: "okay",
  OhIntent: "oh",
  AlrightIntent: "alright",
  RightIntent: "right",
  YeahIntent: "yeah",
  WellIntent: "well",
  SoIntent: "so",
  UhIntent: "uh",
  UmIntent: "um",
  AIntent: "a",
  AnIntent: "an",
  TheIntent: "the",
  AndIntent: "and",
  OrIntent: "or",
  ButIntent: "but",
  IfIntent: "if",
  DoIntent: "do",
  DidIntent: "did",
  BeIntent: "be",
  WillIntent: "will",
  WouldIntent: "would",
  ShallIntent: "shall",
  MayIntent: "may",
  MightIntent: "might",
  MustIntent: "must",
  HaveIntent: "have",
  HasIntent: "has",
  HadIntent: "had",
  OfIntent: "of",
  ForIntent: "for",
  ToIntent: "to",
  InIntent: "in",
  OnIntent: "on",
  AtIntent: "at",
  ByIntent: "by",
  WithIntent: "with",
  FromIntent: "from",
  AsIntent: "as",
  AboutIntent: "about",
  LikeIntent: "like",
  JustIntent: "just",
  WasIntent: "was",
  WereIntent: "were",
  MyIntent: "my",
};
Object.freeze(INTENT_TRIGGER_MAP);

const TriggerIntentHandler = {
  canHandle(handlerInput) {
    const req = handlerInput.requestEnvelope.request;
    return (
      req.type === "IntentRequest" &&
      INTENT_TRIGGER_MAP.hasOwnProperty(req.intent.name)
    );
  },
  async handle(handlerInput) {
    console.log("--------------- GOT TriggerIntentHandler ----------------");
    const req = handlerInput.requestEnvelope.request;
    const intentName = req.intent.name;
    const triggerWord = INTENT_TRIGGER_MAP[intentName];

    const question =
      Alexa.getSlotValue(handlerInput.requestEnvelope, "question") || "";

    const finalQuery = `${triggerWord} ${question}`.trim();

    console.log("Final Query: ", finalQuery);

    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    const prevResponseId = sessionAttributes.prevResponseId;

    try {
      let requestBody = {
        model: "gpt-4o",
        max_output_tokens: 1024,
        input: finalQuery,
      };

      if (prevResponseId) {
        requestBody.previous_response_id = prevResponseId;
      }

      const response = await openai.responses.create(requestBody);
      const aiResponse = response.output_text
        ? response.output_text
        : extractText(response);

      console.log("---- AI Full Response:", response);

      // Save the new response id in session
      sessionAttributes.prevResponseId = response.id;
      attributesManager.setSessionAttributes(sessionAttributes);

      let rb = handlerInput.responseBuilder
        .speak(aiResponse)
        .reprompt("Do you want to ask another question?");

      const aplDirective = buildAplResponse(handlerInput, aiResponse);
      if (aplDirective) rb.addDirective(aplDirective);

      return rb.getResponse();
    } catch (err) {
      console.error("Error querying OpenAI:", err);
      return buildErrorResponse(
        handlerInput,
        "Sorry, there was a problem getting the AI response."
      );
    }
  },
};

/* ===== Story handling stays distinct with your voice magic ===== */
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
      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: `Tell ${storySubject}`,
        store: false,
        instructions: `You are now a one-shot story bot that is imaginative and fun. No questions. Choose single narrator tag "Amy: " or "Matthew: "`,
        max_output_tokens: 800, // tune to fit Alexa time window
        temperature: 0.9,
      });

      let aiResponse = response.output_text
        ? response.output_text
        : extractText(response);

      console.log(
        "------------------- AI FULL RESPONSE -------------------",
        JSON.stringify(aiResponse)
      );

      const voices = ["Amy", "Matthew"];
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

/* ===== Built-ins ===== */
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

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("------------------- Got ErrorHandler -------------------");
    logRequestContext(handlerInput);
    logError(error);

    let intentName = "N/A";
    try {
      const req = handlerInput.requestEnvelope.request;
      if (req.type === "IntentRequest") {
        intentName = req.intent.name || "UnknownIntentName";
      } else {
        intentName = `Non-Intent: ${req.type}`;
      }
    } catch (e) {
      console.log("Unable to infer intent name in ErrorHandler:", e);
    }
    console.log(`---- Inferred Intent: ${intentName}`);

    const isDev = !!process.env.DEBUG;
    const speakOutput = isDev
      ? "Debug mode: I hit an error. Check CloudWatch logs for details."
      : "Sorry, I had trouble doing what you asked. Please try again.";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("Please try again.")
      .withSimpleCard(
        "Error",
        isDev ? "Check logs for details." : "An error occurred."
      )
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    TriggerIntentHandler,
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
