
export const Constants = {
    logo: "/Logo.svg",
    background: "/Background.svg",

    // Form Constants
    formTitle: "Submit Your Creatives For Approval",
    formDescription: "Upload your static images or HTML creatives with offer details to begin the approval process. Our team will review and notify you shortly.",

    // Form Fields
    formFields: [
        {
            label: "Affiliate ID",
            name: "affiliateId",
            type: "text",
            placeholder: "Enter Affiliate ID",
        },
        {
            label: "Company Name",
            name: "companyName",
            type: "text",
            placeholder: "Enter Company Name",
        },
        {
            label: "First Name",
            name: "firstName",
            type: "text",
            placeholder: "Enter First Name",
        },
        {
            label: "Last Name",
            name: "lastName",
            type: "text",
            placeholder: "Enter Last Name",
        },
        {
            label: "Email",
            name: "email",
            type: "email",
            placeholder: "Enter Email",
        },
        {
            label: "Telegram ID (Optional)",
            name: "telegramId",
            type: "text",
            placeholder: "Enter Telegram ID",
        },
        {
            label: "Offer ID",
            name: "offerId",
            type: "select",
            options: [
                { label: "Loading offers...", value: "loading" },
            ],
            placeholder: "Select Offer",
        },
        {
            label: "Creative Type",
            name: "creativeType",
            type: "select",
            options: [
                { label: "Email", value: "email" },
                { label: "Display", value: "display" },
                { label: "Search", value: "search" },
                { label: "Social", value: "social" },
                { label: "Native", value: "native" },
                { label: "Push", value: "push" },
            ],
            placeholder: "Select Creative Type",
        },
        {
            label: "Additional Notes or Requests for Client",
            name: "additionalNotes",
            type: "textarea",
            placeholder: "Enter Additional Notes or Requests for Client",
        },
        {
            label: "From Lines",
            name: "fromLines",
            type: "textarea",
            placeholder: "Enter From Lines",
        },
        {
            label: "Subject Lines",
            name: "subjectLines",
            type: "textarea",
            placeholder: "Enter Subject Lines",
        },
    ],

    // Upload Creative Types
    uploadCreativeTypes: [ 
        { label: "Single Creative", value: "singleCreative" },
        { label: "Multiple Creatives", value: "multipleCreatives" },
        { label: "From & Subject Lines", value: "fromSubjectLines" },
    ],

    // Button Texts
    buttonTexts: {
        next: "Next",
        previous: "Previous",
        submit: "Submit Creative",
        loading: "Loading...",
        verifying: "Verifying...",
        verify: "Verify",
        verified: "Verified",
        startBot: "Start Bot",
        nextStep2: "Save & Add Contact Details",
        prevStep1: "Edit Personal Details",
        nextStep3: "Save & Add Creative Details",
        prevStep2: "Edit Contact Details",
    },

    // Step Labels
    stepLabels: {
        step1: "Personal Details",
        step2: "Contact Details", 
        step3: "Creative Details",
    },

    // Current Step
    currentStep: [
        {
            stepNumber: 1,
            stepLabel: "Personal Details",
        },
        {
            stepNumber: 2,
            stepLabel: "Contact Details",
        },
        {
            stepNumber: 3,
            stepLabel: "Creative Details",
        },
    ],
    
    totalSteps: 3,

    // Verification Steps
    verificationSteps: [
        "Click on Start Bot Button",
        "Send /start to the bot",
        "Come back and Verify again",
    ],

    // From & Subject Lines Configuration
    fromSubjectLinesConfig: {
        title: "From & Subject Lines",
        description: "Enter compelling from lines and subject lines for your email campaigns",
        guidelines: {
            title: "Email Content Guidelines:",
            items: [
                "From Lines: Enter the sender name/email that will appear in the \"From\" field",
                "Subject Lines: Enter compelling subject lines to improve email open rates",
                "Multiple Lines: You can enter multiple options separated by line breaks",
                "Best Practices: Keep subject lines under 50 characters for better display"
            ]
        },
        fromLines: {
            label: "From Lines *",
            placeholder: "Enter from lines",
            helpText: "Enter multiple from lines separated by line breaks. Each line will be used as an option.",
            required: true
        },
        subjectLines: {
            label: "Subject Lines *",
            placeholder: "Enter subject lines",
            helpText: "Enter multiple subject lines separated by line breaks. Each line will be used as an option.",
            required: true
        },
        buttons: {
            save: "Save Lines",
            cancel: "Cancel"
        },
        characterCount: {
            fromLines: "From Lines: {count} characters",
            subjectLines: "Subject Lines: {count} characters"
        }
    },

    // Prority
    priorityLevels: [
        { name: "High", value: "high" },
        { name: "Medium", value: "medium" },
    ]
} 