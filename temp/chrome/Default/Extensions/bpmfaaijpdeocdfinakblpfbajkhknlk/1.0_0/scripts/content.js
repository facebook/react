// Select the existing button using its jsname attribute

if (document.title === 'Access Denied') {
    const requestAccessButton = document.querySelector('button.UywwFc-LgbsSe');

    if (requestAccessButton) {
        // Go up to the closest wrapping div
        const wrapperDiv = requestAccessButton.closest('div.VfPpkd-dgl2Hf-ppHlrf-sM5MNb');

        if (wrapperDiv) {
            // Clone the entire div element
            const clonedDiv = wrapperDiv.cloneNode(true);

            // Find the button inside the cloned div
            const clonedButton = clonedDiv.querySelector('button.UywwFc-LgbsSe');

            if (clonedButton) {
                // Change the text content inside the button to "See Owner"
                const buttonText = clonedButton.querySelector('span[jsname="V67aGc"]');
                if (buttonText) {
                    buttonText.textContent = 'See Owner [FB-Only]';
                }
                clonedButton.style.float = 'right';

                // Add a click event listener to the cloned button
                clonedButton.addEventListener('click', function(event) {
                    // Prevent other listeners from being triggered
                    event.stopImmediatePropagation();

                    // Construct the URL using window.link
                    const url = `https://www.internalfb.com/intern/bunny?q=owner%20${document.location}`;

                    // Open the URL in a new tab
                    window.open(url, '_blank');
                });
            }

            // Insert the cloned div after the original one
            wrapperDiv.insertAdjacentElement('afterend', clonedDiv);
        }
    }
}
