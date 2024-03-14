// ==UserScript==
// @name         Etsy Listing Date and Favorite Count
// @namespace    https://github.com/cengaver
// @version      0.211
// @description  Displays the listing date and favorite count of a product on Etsy.
// @author       Cengaver
// @match        https://www.etsy.com/*
// @grant        GM_addStyle
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// ==/UserScript==

(function() {
    'use strict';

    // Extract listing date and favorite count from HTML content
    function getInfoFromHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Find the listing date
        const listingDateElement = doc.querySelector('.wt-pr-xs-2.wt-text-caption');
        const listingDate = listingDateElement ? listingDateElement.textContent.trim().replace("Listed on ", "") : '';

        // Find the favorite count
        const favoriteCountElement = doc.querySelector('.wt-text-link[href*="/favoriters"]');
        let favoriteCount = 0;
        if (favoriteCountElement) {
            const favoriteText = favoriteCountElement.textContent.trim();
            const regexResult = favoriteText.match(/(\d+)/);
            if (regexResult && regexResult.length > 0) {
                favoriteCount = parseInt(regexResult[0]);
            }
        }

        return { listingDate, favoriteCount };
    }

    // Calculate days ago from a given date string
    function daysAgoFromDate(dateString) {
        // Convert the given date string to a date object
        const listingDate = new Date(dateString);
        // Get today's date
        const today = new Date();
        // Calculate the difference between the dates and return in days
        const differenceInTime = today.getTime() - listingDate.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
        return differenceInDays;
    }

    // Remove duplicate tags from a string
    function removeDuplicateTags(tagString) {
        // Split the tag string by comma to create an array
        const tagArray = tagString.split(',').map(tag => tag.trim());

        // Get unique elements from the array
        const uniqueTags = [...new Set(tagArray)];

        // Join unique elements to get a string with no duplicates
        const uniqueTagString = uniqueTags.join(', ');

        return uniqueTagString;
    }

    // Replace specific terms in a title
    function titleReplace(titleString) {
        let titleReplaced = titleString ? titleString.trim() : '';
        titleReplaced = titleReplaced.replaceAll(/T-Shirt|Cutting File|Cut File for Cricut|DIY Projects|Design|Vector|Eps|Jpg|Dxf|Print|Pdf|Svg|Png|File|Transparent|Prints|Sublimation|Clipart|Cutting Machine|Instant Download|Sublimate|Image|Download|Downloads|Clip Art|Designs|Cricut|Silhouette|Digital|Canvas|Surfaces|Stencils|Templates|Transfers|Shirts/gi, 'Shirt');
        titleReplaced = titleReplaced.replaceAll(/&/g, '');
        titleReplaced = titleReplaced.replaceAll(/\|/g, ',');
        titleReplaced = titleReplaced.replaceAll(/\s+/g, ' ');
        let regex = /Shirt Shirt/gi;
        let regex2 = /Shirt, Shirt/gi;
        let regex3 = /Shirt & Shirt/gi;
        let regex4 = /, Shirt,/gi;
        while (titleReplaced.match(regex2)) {
            titleReplaced = titleReplaced.replaceAll(regex2, 'Shirt').trim();
        }
        while (titleReplaced.match(regex3)) {
            titleReplaced = titleReplaced.replaceAll(regex3, 'Shirt').trim();
        }
        while (titleReplaced.match(regex)) {
            titleReplaced = titleReplaced.replaceAll(regex, 'Shirt').trim();
        }
        while (titleReplaced.match(regex4)) {
            titleReplaced = titleReplaced.replaceAll(regex4, '').trim();
        }
        return removeDuplicateTags(titleReplaced);
    }

    // Concatenate text content of list items in HTML
    function concatenateListItems(tagContent) {
        let concatenatedText = '';
        tagContent.forEach((item, index) => {
            concatenatedText += item.textContent.trim();
            if (index < tagContent.length - 1) {
                concatenatedText += ', ';
            }
        });

        return concatenatedText;
    }

    // Copy a specified text to clipboard
    function copyText(textToCopy) {
        navigator.clipboard.writeText(textToCopy)
        .then(() => {
            console.log('Text copied to clipboard:', textToCopy);
        })
        .catch(err => {
            console.error('Error copying text:', err);
        });
    }

    // Convert comma-separated number to normal number
    function convertCommaSeparatedNumber(commaSeparatedNumber) {
        return parseFloat(commaSeparatedNumber.replace(',', '.'));
    }

    // Check if we are on a product page
    if (window.location.href.indexOf("etsy.com/listing/") !== -1) {
        const listingDateElement = document.querySelector('.wt-pr-xs-2.wt-text-caption');
        const listingDate = listingDateElement ? listingDateElement.textContent.trim().replace("Listed on ", "") : '';

        const favoriteCountElement = document.querySelector('.wt-text-link[href*="/favoriters"]');
        let favoriteCount = 0;
        if (favoriteCountElement) {
            const favoriteText = favoriteCountElement.textContent.trim();
            const regexResult = favoriteText.match(/(\d+)/);
            if (regexResult && regexResult.length > 0) {
                favoriteCount = parseInt(regexResult[0]);
            }
        }

        const listingTitleElement = document.querySelector('#listing-page-cart > div.wt-mb-xs-1 > h1');
        const listingTitle = titleReplace(listingTitleElement.textContent.trim());

        const listItems = document.querySelectorAll('.tag-card-title');
        const concatenatedTextValue = concatenateListItems(listItems);

        let conText = "";
        const tagContainer = document.querySelector('.wt-action-group.wt-list-inline.wt-mb-xs-2');
        if (!tagContainer) {
            conText = titleReplace(concatenatedTextValue);
        } else {
            const tagElements = concatenateListItems(tagContainer.querySelectorAll('li.wt-action-group__item-container a'));
            conText = titleReplace(concatenatedTextValue + "," + tagElements);
        }

        if (listingDate && favoriteCount) {
            console.log("Listing Date: " + listingDate);
            console.log("Favorite Count: " + favoriteCount);
            console.log("Title: " + listingTitle);
            console.log("Tags: " + concatenatedTextValue);

            const avrage = favoriteCount / daysAgoFromDate(listingDate);
            if (favoriteCount > 50) {
                favoriteCount = "❤️" + favoriteCount;
            }
            var bestsellerElement = document.getElementById("bestseller");
            let bestseller ="";
            if (bestsellerElement!== null){
                bestseller = '<p style="margin: 0;"> 🎀 Bestseller </p>'
                console.log("Bestseller: " + bestseller);
            }
            const reviewItemElement = document.querySelector(' #same-listing-reviews-tab > span');
            let review ="";
            if (reviewItemElement!== null){
                var reviewCount = convertCommaSeparatedNumber(reviewItemElement.textContent.trim());
            if (reviewCount > 10) {
                reviewCount = "★" + reviewCount;
            }
                review = '<p style="margin: 0;">Rev : '+reviewCount+' </p>'
                console.log("ReviewItem: " + reviewCount);
            }
            const script = document.querySelector('script[type="application/ld+json"]');
            const jsonData = JSON.parse(script.textContent.trim());
            console.log(jsonData);
            const eligibleQuantity = jsonData.offers.eligibleQuantity;
            const offerCount = jsonData.offers.offerCount;
            console.log("Eligible Quantity:", eligibleQuantity);
            let sales ="";
            if (eligibleQuantity=== undefined){ eligibleQuantity = offerCount}
            if (eligibleQuantity!== undefined){
               var salesCount = 999 - eligibleQuantity;
            if (salesCount > 50) {
                salesCount = "★" + salesCount;
            }
                sales = '<p style="margin: 0;">Sat : '+salesCount+' </p>'
                console.log("Sales Count: " + salesCount);
            }

            const balloonDiv = document.createElement("div");
            balloonDiv.setAttribute("id", "etsyInfoBalloon");
            balloonDiv.innerHTML = `
                <div style="position: fixed; top: 60px; left: 90%; transform: translateX(-50%); background-color: yellow; border: 1px solid #ccc; border-radius: 5px; padding: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); z-index: 9999;">
                     ${bestseller}
                     ${review}
                     ${sales}
                    <p style="margin: 0;">Fav : ${favoriteCount}</p>
                    <p style="margin: 0;">${listingDate}</p>
                    <p style="margin: 0;">Days Ago : ${daysAgoFromDate(listingDate)}</p>
                    <p style="margin: 0;">Avg : ${parseFloat(avrage.toFixed(1))}</p>
                    <button id="copy">Copy</button>
                </div>
            `;
            document.body.appendChild(balloonDiv);

            const inputElement = document.querySelector('input[name="listing_id"]');
            const listingId = inputElement.value;
            console.log("Listing ID:", listingId);

            document.getElementById("copy").onclick = function(){
                copyText("Listing ID:"+listingId+"\n"+listingTitle+"\n"+conText)
                console.log("Text copied to clipboard:\nListing ID:"+listingId+"\n"+listingTitle+"\n"+conText);
            }
        }
    }
})();
