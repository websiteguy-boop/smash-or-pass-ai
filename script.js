document.addEventListener('DOMContentLoaded', () => {
    const genderSelect = document.getElementById('gender');
    const ageInput = document.getElementById('age');
    const imageUpload = document.getElementById('image-upload');
    const fileNameSpan = document.getElementById('file-name');
    const aiMoodSelect = document.getElementById('ai-mood');
    const submitBtn = document.getElementById('submit-btn');
    
    const inputSection = document.getElementById('input-section');
    const resultSection = document.getElementById('result-section');
    const loader = document.getElementById('loader');
    const resultContent = document.getElementById('result-content');
    
    const resultImage = document.getElementById('result-image');
    const verdictEl = document.getElementById('verdict');
    const commentEl = document.getElementById('comment');

    let uploadedImageDataUrl = null;

    imageUpload.addEventListener('change', () => {
        const file = imageUpload.files[0];
        if (file) {
            fileNameSpan.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImageDataUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            fileNameSpan.textContent = 'No file chosen';
            uploadedImageDataUrl = null;
        }
    });

    submitBtn.addEventListener('click', async () => {
        const age = ageInput.value;
        const gender = genderSelect.value;
        const mood = aiMoodSelect.value;

        if (!age || age < 18) {
            alert('Please enter a valid age (18+).');
            return;
        }
        if (!uploadedImageDataUrl) {
            alert('Please upload an image.');
            return;
        }

        if (mood === 'NSFW') {
            const confirmed = confirm("You have selected NSFW mode. The AI's response may be explicit, offensive, or inappropriate. Do you wish to continue?");
            if (!confirmed) {
                return;
            }
        }

        // Hide form, show loader
        inputSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        loader.classList.remove('hidden');
        resultContent.classList.add('hidden');
        submitBtn.disabled = true;

        try {
            const systemPrompt = `You are an AI that plays 'Smash or Pass'. You will be given an image of a person, their age, their gender, and a 'mood' setting. Your task is to analyze the image and decide whether you would 'Smash' or 'Pass'.
You MUST respond ONLY with a valid JSON object with two keys: "decision" (which must be the string 'Smash' or 'Pass') and "comment" (a string with your reasoning).
The style of your comment MUST strictly adhere to the provided mood:
- SFW: Wholesome, polite, and friendly. Give a kind compliment regardless of the decision.
- Suggestive: Flirty, cheeky, or slightly suggestive. Hint at attraction for 'Smash', be playfully dismissive for 'Pass'.
- NSFW: Brutally honest, direct, and uncensored. If the decision is 'Smash', be explicit about what you find attractive. If the decision is 'Pass', give a vulgar or insulting reason why, potentially describing something you wouldn't do to them as per the user's request.
Do not include any other text, greetings, or explanations outside of the JSON structure.`;
            
            const userPrompt = `Analyze the user in the image and provide your 'Smash or Pass' judgment. User data: Age: ${age}, Gender: ${gender}. Required mood for your response: ${mood}.`;

            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: userPrompt },
                            { type: 'image_url', image_url: { url: uploadedImageDataUrl } },
                        ],
                    },
                ],
                json: true,
            });

            const result = JSON.parse(completion.content);
            displayResult(result);

        } catch (error) {
            console.error('AI API call failed:', error);
            commentEl.textContent = 'The AI is having trouble making a decision. Please try again later.';
            verdictEl.textContent = 'Error';
            verdictEl.className = '';
            // Reset UI on error
            resultImage.classList.add('hidden');

        } finally {
            // Hide loader, show result
            loader.classList.add('hidden');
            resultContent.classList.remove('hidden');
            // Allow for a new submission
            setTimeout(() => {
                inputSection.classList.remove('hidden');
                submitBtn.disabled = false;
            }, 1000);
        }
    });

    function displayResult(result) {
        resultImage.src = uploadedImageDataUrl;
        resultImage.classList.remove('hidden');
        
        const decision = result.decision || 'Error';
        const comment = result.comment || 'The AI failed to provide a comment.';

        verdictEl.textContent = decision;
        verdictEl.className = ''; // Clear previous classes
        if (decision.toLowerCase() === 'smash') {
            verdictEl.classList.add('smash');
        } else {
            verdictEl.classList.add('pass');
        }

        commentEl.textContent = comment;
    }
});

