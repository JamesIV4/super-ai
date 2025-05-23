const introScreenApl = {
    "type": "APL",
    "version": "2024.2",
    "license": "Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0\nLicensed under the Amazon Software License  http://aws.amazon.com/asl/",
    "theme": "dark",
    "import": [
        {
            "name": "alexa-layouts",
            "version": "1.7.0"
        }
    ],
    "resources": [
        {
            "description": "Default dimensions, numbers and strings for the AlexaHeadline.",
            "dimensions": {
                "primaryTextMaxWidth": "100%",
                "secondaryTextMaxWidth": "100%",
                "secondaryTextTopPadding": "@spacingXSmall",
                "contentPaddingLeft": "@marginHorizontal"
            },
            "numbers": {
                "headlinePrimaryTextMaxLines": 2
            },
            "strings": {
                "textComponentAlign": "center"
            }
        },
        {
            "description": "Dimensions for the AlexaHeadline - hubLandscapeLarge.",
            "when": "${@viewportProfile == @hubLandscapeLarge}",
            "numbers": {
                "headlinePrimaryTextMaxLines": 4
            }
        },
        {
            "description": "Dimensions for the AlexaHeadline - hubRound.",
            "when": "${@viewportProfileCategory == @hubRound}",
            "dimensions": {
                "secondaryTextTopPadding": "@spacing3XSmall"
            }
        },
        {
            "description": "Dimensions for the AlexaHeadline - tvLandscapeOverlay/tvLandscapeXLarge.",
            "when": "${@viewportProfile == @tvLandscapeXLarge || @viewportProfile == @tvLandscapeOverlay}",
            "dimensions": {
                "primaryTextMaxWidth": "560dp",
                "secondaryTextMaxWidth": "560dp",
                "secondaryTextTopPadding": "@spacing3XSmall"
            }
        },
        {
            "description": "Dimensions for the AlexaHeadline - tvLandscapeXLarge.",
            "when": "${@viewportProfile == @tvLandscapeXLarge}",
            "numbers": {
                "headlinePrimaryTextMaxLines": 4
            }
        },
        {
            "description": "Dimensions, numbers and strings for the AlexaHeadline - tvPortraitOverlay.",
            "when": "${@viewportProfile == @tvPortraitOverlay}",
            "dimensions": {
                "primaryTextMaxWidth": "220dp",
                "secondaryTextMaxWidth": "220dp",
                "contentPaddingLeft": "@spacing2XLarge"
            },
            "strings": {
                "textComponentAlign": "left"
            }
        },
        {
            "description": "Dimensions, numbers and strings for the AlexaHeadline - mobileSmall portrait.",
            "when": "${@viewportProfile == @mobileSmall && @viewportOrientation == @viewportOrientationPortrait}",
            "numbers": {
                "headlinePrimaryTextMaxLines": 4
            }
        },
        {
            "description": "Dimensions, numbers and strings for the AlexaHeadline - mobileMedium.",
            "when": "${@viewportProfile == @mobileMedium}",
            "dimensions": {
                "primaryTextMaxWidth": "758dp"
            },
            "numbers": {
                "headlinePrimaryTextMaxLines": 4
            }
        },
        {
            "description": "Dimensions, numbers and strings for the AlexaHeadline - mobileLarge.",
            "when": "${@viewportProfile == @mobileLarge}",
            "dimensions": {
                "primaryTextMaxWidth": "1025dp"
            },
            "numbers": {
                "headlinePrimaryTextMaxLines": 4
            }
        },
        {
            "description": "Dimensions, numbers and strings for the AlexaHeadline - hubPortraitMedium.",
            "when": "${@viewportProfile == @hubPortraitMedium}",
            "numbers": {
                "headlinePrimaryTextMaxLines": 4
            }
        },
        {
            "description": "Dimensions, numbers and strings for the AlexaHeadline - hubLandscapeXLarge.",
            "when": "${@viewportProfile == @hubLandscapeXLarge}",
            "dimensions": {
                "primaryTextMaxWidth": "1440dp"
            },
            "numbers": {
                "headlinePrimaryTextMaxLines": 4
            }
        }
    ],
    "styles": {
        "primaryTextLight": {
            "extends": "textStyleDisplay4",
            "values": [
                {
                    "color": "@colorTextReversed"
                }
            ]
        },
        "secondaryTextLight": {
            "extends": "textStyleCallout",
            "values": [
                {
                    "color": "@colorTextReversed"
                }
            ]
        }
    },
    "layouts": {
        "AlexaHeadline": {
            "parameters": [
                {
                    "name": "theme",
                    "description": "Colors will be switched depending on the specified theme (light/dark). Default to dark theme",
                    "type": "string",
                    "default": "dark"
                },
                {
                    "name": "primaryText",
                    "description": "Primary message",
                    "type": "string"
                },
                {
                    "name": "secondaryText",
                    "description": "secondary message",
                    "type": "string"
                },
                {
                    "name": "headerAttributionOpacity",
                    "type": "number",
                    "default": "${@viewportProfileCategory == @hubRound ? 1 : @opacitySecondary}"
                },
                {
                    "name": "headerTitle",
                    "description": "Primary text to render in header.",
                    "type": "string"
                },
                {
                    "name": "headerSubtitle",
                    "description": "Secondary text to render in header.",
                    "type": "string"
                },
                {
                    "name": "headerAttributionText",
                    "description": "Attribution text to render in header. Only shown when no headerAttributionImage is provided, and when headerAttributionPrimacy is true, or on a device that shows Title/Subtitle and Attribution.",
                    "type": "string"
                },
                {
                    "name": "headerAttributionImage",
                    "description": "URL for attribution image source. Only shown when headerAttributionPrimacy is true, or on a device that shows Title/Subtitle and Attribution.",
                    "type": "string"
                },
                {
                    "name": "headerAttributionPrimacy",
                    "description": "On devices that can only display one element due to screen size, Attribution is prioritized. Setting False displays Title/Subtitle.  Defaults to true.",
                    "type": "boolean",
                    "default": true
                },
                {
                    "name": "headerDivider",
                    "description": "Toggle to display the divider that appears at the bottom of header to help separate it from the content below. Default to false",
                    "type": "boolean",
                    "default": false
                },
                {
                    "name": "headerBackButton",
                    "description": "Toggle to display back button in header. Defaults to false.",
                    "type": "boolean",
                    "default": false
                },
                {
                    "name": "headerBackButtonAccessibilityLabel",
                    "description": "An accessibility label to describe the back button to customers who use a screen reader.",
                    "type": "string"
                },
                {
                    "name": "headerBackButtonCommand",
                    "description": "Command that is issued when back button is pressed.",
                    "type": "any",
                    "default": {
                        "type": "SendEvent",
                        "arguments": [
                            "goBack"
                        ]
                    }
                },
                {
                    "name": "headerBackgroundColor",
                    "description": "Optional color value to use as background color for Header. Defaults to transparent.",
                    "type": "color",
                    "default": "transparent"
                },
                {
                    "name": "backgroundColor",
                    "description": "Color value to use as background color for layout.",
                    "type": "color"
                },
                {
                    "name": "backgroundImageSource",
                    "description": "URL for background image source.",
                    "type": "string"
                },
                {
                    "name": "backgroundVideoSource",
                    "description": "URL for background video source.",
                    "type": "any"
                },
                {
                    "name": "backgroundScale",
                    "description": "Image/video scale to apply to background image/video. Defaults to best-fill.",
                    "type": "string",
                    "default": "best-fill"
                },
                {
                    "name": "backgroundAlign",
                    "description": "Image/video alignment to apply to background image/video. Defaults to center.",
                    "type": "string",
                    "align": "center"
                },
                {
                    "name": "backgroundBlur",
                    "description": "Toggle to apply background blur. Defaults to false.",
                    "type": "boolean",
                    "default": false
                },
                {
                    "name": "backgroundColorOverlay",
                    "description": "Toggle to apply overlay scrim to background image/video. Defaults to false.",
                    "type": "boolean",
                    "default": false
                },
                {
                    "name": "backgroundOverlayGradient",
                    "description": "Toggle to apply gradient to background image/video. Defaults to false.",
                    "type": "boolean",
                    "default": false
                },
                {
                    "name": "backgroundVideoAutoPlay",
                    "description": "Toggle to autoplay background video(s). Defaults to false.",
                    "type": "boolean",
                    "default": false
                },
                {
                    "name": "backgroundVideoAudioTrack",
                    "description": "Audio track to play on. Defaults to foreground. EM can select foreground | background | none.",
                    "type": "string",
                    "default": "foreground"
                },
                {
                    "name": "footerHintText",
                    "type": "string",
                    "description": "Hint text to display in Footer."
                },
                {
                    "name": "entities",
                    "description": "Array of entity data bind to this layout",
                    "type": "any"
                },
                {
                    "name": "layoutDirection",
                    "description": "The layoutDirection of AlexaHeadline. It can be LTR or RTL. By default, it uses environment layoutDirection.",
                    "type": "string",
                    "default": "${environment.layoutDirection}"
                },
                {
                    "name": "lang",
                    "description": "The lang property of AlexaHeadline. Set the lang property to a BCP-47 string (e.g., en-US). By default, it uses environment lang.",
                    "type": "string",
                    "default": "${environment.lang}"
                }
            ],
            "items": [
                {
                    "type": "Container",
                    "layoutDirection": "${layoutDirection}",
                    "height": "100vh",
                    "entities": "${entities}",
                    "items": [
                        {
                            "type": "AlexaBackground",
                            "backgroundColor": "${backgroundColor}",
                            "backgroundImageSource": "${backgroundImageSource}",
                            "backgroundVideoSource": "${backgroundVideoSource}",
                            "backgroundScale": "${backgroundScale}",
                            "backgroundAlign": "${backgroundAlign}",
                            "backgroundBlur": "${backgroundBlur}",
                            "colorOverlay": "${backgroundColorOverlay}",
                            "overlayGradient": "${backgroundOverlayGradient}",
                            "videoAutoPlay": "${backgroundVideoAutoPlay}",
                            "videoAudioTrack": "${backgroundVideoAudioTrack}"
                        },
                        {
                            "type": "Container",
                            "height": "100vh",
                            "width": "100vw",
                            "position": "absolute",
                            "items": [
                                {
                                    "type": "Container",
                                    "grow": 1,
                                    "justifyContent": "center",
                                    "paddingLeft": "@contentPaddingLeft",
                                    "paddingRight": "@marginHorizontal",
                                    "alignItems": "center",
                                    "items": [
                                        {
                                            "when": "${primaryText && primaryText != ''}",
                                            "type": "Text",
                                            "style": "${theme == 'light' ? 'primaryTextLight' : 'textStyleDisplay4'}",
                                            "text": "${primaryText}",
                                            "opacity": 1,
                                            "textAlign": "@textComponentAlign",
                                            "maxWidth": "@primaryTextMaxWidth",
                                            "maxLines": "@headlinePrimaryTextMaxLines"
                                        },
                                        {
                                            "when": "${secondaryText && secondaryText != ''}",
                                            "type": "Text",
                                            "style": "${theme == 'light' ? 'secondaryTextLight' : 'textStyleCallout'}",
                                            "text": "${secondaryText}",
                                            "maxLines": 1,
                                            "opacity": "@opacitySecondary",
                                            "textAlign": "@textComponentAlign",
                                            "maxWidth": "@secondaryTextMaxWidth",
                                            "paddingTop": "@secondaryTextTopPadding"
                                        }
                                    ]
                                },
                                {
                                    "type": "AlexaHeader",
                                    "theme": "${theme}",
                                    "headerTitle": "${headerTitle}",
                                    "layoutDirection": "${layoutDirection}",
                                    "headerSubtitle": "${@viewportProfile != @tvLandscapeOverlay ? headerSubtitle : ''}",
                                    "headerAttributionText": "${headerAttributionText}",
                                    "headerAttributionImage": "${headerAttributionImage}",
                                    "headerAttributionPrimacy": "${headerAttributionPrimacy}",
                                    "headerDivider": "${headerDivider}",
                                    "headerBackButton": "${headerBackButton}",
                                    "headerBackButtonAccessibilityLabel": "${headerBackButtonAccessibilityLabel}",
                                    "headerBackButtonCommand": "${headerBackButtonCommand}",
                                    "headerBackgroundColor": "${headerBackgroundColor}",
                                    "headerAttributionOpacity": "${headerAttributionOpacity}",
                                    "position": "absolute",
                                    "width": "100%",
                                    "top": "0"
                                },
                                {
                                    "when": "${@viewportProfileCategory != @hubRound && @viewportProfile != @tvLandscapeOverlay && footerHintText}",
                                    "type": "AlexaFooter",
                                    "style": "secondaryTextLight",
                                    "hintText": "${footerHintText}",
                                    "theme": "${theme}",
                                    "lang": "${lang}",
                                    "position": "absolute",
                                    "width": "100%",
                                    "bottom": "0"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    "mainTemplate": {
        "parameters": [
            "payload"
        ],
        "item": [
            {
                "type": "AlexaHeadline",
                "id": "IntroHeadline",
                "primaryText": "${payload.headlineTemplateData.properties.textContent.primaryText.text}",
                "footerHintText": "${payload.headlineTemplateData.properties.hintText}",
                "backgroundImageSource": "${payload.headlineTemplateData.properties.backgroundImage.sources[0].url}",
                "backgroundColorOverlay": false,
                "theme": "dark"
            }
        ]
    }
};

const responseScreenApl = {
    "type": "APL",
    "version": "2024.2",
    "license": "Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0\nLicensed under the Amazon Software License  http://aws.amazon.com/asl/",
    "theme": "dark",
    "import": [
        {
            "name": "alexa-layouts",
            "version": "1.7.0"
        }
    ],
    "mainTemplate": {
        "parameters": [
            "payload"
        ],
        "item": [
            {
                "type": "Container",
                "height": "100vh",
                "items": [
                    {
                        "type": "AlexaBackground",
                        "backgroundImageSource": "${payload.longTextTemplateData.properties.backgroundImage.sources[0].url}",
                        "backgroundBlur": false,
                        "backgroundScale": "best-fill"
                    },
                    {
                        "type": "Container",
                        "height": "100vh",
                        "width": "100vw",
                        "items": [
                            {
                                "type": "AlexaHeader",
                                "headerTitle": "${payload.longTextTemplateData.properties.title}",
                                "headerAttributionImage": "${payload.longTextTemplateData.properties.logoUrl}",
                                "headerDivider": false
                            },
                            {
                                "type": "ScrollView",
                                "grow": 1,
                                "paddingTop": "@spacingMedium",
                                "paddingBottom": "${@spacing3XLarge + @spacingXSmall}",
                                "paddingLeft": "@marginHorizontal",
                                "paddingRight": "@marginHorizontal",
                                "items": [
                                    {
                                        "type": "Text",
                                        "id": "aiResponse",
                                        "style": "textStyleDisplay4",
                                        "highlightMode": "line",
                                        "text": "${payload.longTextTemplateData.properties.textContent.primaryText.text}",
                                        "speech": "${payload.longTextTemplateData.properties.speechText}",
                                        "textAlign": "left"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "onMount": [
        {
            "type": "SpeakItem",
            "componentId": "aiResponse",
            "highlightMode": "line",
            "align": "center"
        }
    ]
};

module.exports = { introScreenApl, responseScreenApl };
