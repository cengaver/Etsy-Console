// ==UserScript==
// @name         Etsy Listelenme Tarihi ve Favori Sayısı
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Etsy'de bir ürünün listelenme tarihini ve favori sayısını gösterir.
// @author       Your Name
// @match        https://www.etsy.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Tarihi ve favori sayısını al
    function getInfoFromHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Listelenme tarihini bul
        const listingDateElement = doc.querySelector('.wt-pr-xs-2.wt-text-caption');
        const listingDate = listingDateElement ? listingDateElement.textContent.trim().replace("Listed on ", "") : '';

        // Favori sayısını bul
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

    // Tarihi bugünden kaç gün önce olduğunu hesapla
    function daysAgoFromDate(dateString) {
        // Verilen tarih stringini tarihe dönüştür
        const listingDate = new Date(dateString);
        // Bugünün tarihini al
        const today = new Date();
        // Tarihler arasındaki farkı hesapla ve gün cinsinden dön
        const differenceInTime = today.getTime() - listingDate.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
        return differenceInDays;
    }

    // Dize içindeki etiketleri teke indirgeme
    function removeDuplicateTags(tagString) {
        // Etiketleri virgülle ayırarak bir dizi oluştur
        const tagArray = tagString.split(',').map(tag => tag.trim());

        // Dizideki benzersiz öğeleri al
        const uniqueTags = [...new Set(tagArray)];

        // Benzersiz öğeleri birleştirerek tekilleştirilmiş bir dize elde et
        const uniqueTagString = uniqueTags.join(', ');

        return uniqueTagString;
    }

    // Başlığı düzenle
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

    // HTML içeriğindeki liste öğelerinin metin içeriklerini bir araya getirir
    function concatenateListItems(tagContent) {
        // Metin içeriklerini bir araya getir
        let concatenatedText = '';
        tagContent.forEach((item, index) => {
            // Her öğenin metnini al ve virgülle birleştir
            concatenatedText += item.textContent.trim();
            // Son öğe değilse virgül ekle
            if (index < tagContent.length - 1) {
                concatenatedText += ', ';
            }
        });

        return concatenatedText;
    }
    // belli metni panoya kopyala
    function copyText(textToCopy) {
        navigator.clipboard.writeText(textToCopy)
        .then(() => {
            console.log('Metin başarıyla panoya kopyalandı:', textToCopy);
        })
        .catch(err => {
            console.error('Metin kopyalanırken bir hata oluştu:', err);
        });
    }

    // Ürün sayfasında mı kontrol ediyoruz
    if (window.location.href.indexOf("etsy.com/listing/") !== -1) {
        // Listelenme tarihini bulmak için gerekli sınıf
        const listingDateElement = document.querySelector('.wt-pr-xs-2.wt-text-caption');
        const listingDate = listingDateElement ? listingDateElement.textContent.trim().replace("Listed on ", "") : '';

        // Favori sayısını bulmak için gerekli sınıf
        const favoriteCountElement = document.querySelector('.wt-text-link[href*="/favoriters"]');
        let favoriteCount = 0;
        if (favoriteCountElement) {
            const favoriteText = favoriteCountElement.textContent.trim();
            const regexResult = favoriteText.match(/(\d+)/);
            if (regexResult && regexResult.length > 0) {
                favoriteCount = parseInt(regexResult[0]);
            }
        }

        // Başlık ve etiketleri al
        const listingTitleElement = document.querySelector('#listing-page-cart > div.wt-mb-xs-1 > h1');
        const listingTitle = titleReplace(listingTitleElement.textContent.trim());

        // Liste öğelerini al
        const listItems = document.querySelectorAll('.tag-card-title');
        const concatenatedTextValue = concatenateListItems(listItems);

        // İkinci etiketleri al
        let conText = "";
        const tagContainer = document.querySelector('.wt-action-group.wt-list-inline.wt-mb-xs-2');
        if (!tagContainer) {
            conText = titleReplace(concatenatedTextValue);
        } else {
            const tagElements = concatenateListItems(tagContainer.querySelectorAll('li.wt-action-group__item-container a'));
            conText = titleReplace(concatenatedTextValue + "," + tagElements);
        }

        // Başlık ve etiketleri sayfaya ekle
        listingTitleElement.innerHTML = `
            ${listingTitleElement.textContent}<br><hr><div class="wt-bg-turquoise-tint wt-text-gray wt-text-caption wt-pt-xs-1 wt-pb-xs-1">${listingTitle} <br><hr>${conText}</div>
        `;

        // Eğer listelenme tarihi ve favori sayısı bulunduysa
        if (listingDate && favoriteCount) {
            console.log("Listelenme Tarihi: " + listingDate);
            console.log("Favori Sayısı: " + favoriteCount);
            console.log("Başlık: " + listingTitle);
            console.log("Etiket: " + concatenatedTextValue);
            //console.log("Etiket2: " + tagElements);
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
                var reviewCount = reviewItemElement.textContent.trim();
            if (reviewCount > 10) {
                reviewCount = "★" + reviewCount;
            }
                review = '<p style="margin: 0;">Rev : '+reviewCount+' </p>'
                console.log("ReviewItem: " + reviewCount);
            }
            // İlgili script etiketini seç
            const script = document.querySelector('script[type="application/ld+json"]');

            // Script etiketinin içeriğini al
            const jsonData = JSON.parse(script.textContent.trim());

            // Alınan JSON verisini konsola yazdır
            console.log(jsonData);
            const eligibleQuantity = jsonData.offers.eligibleQuantity;
            console.log("eligibleQuantity:", eligibleQuantity);
            let sales ="";
            if (eligibleQuantity!== null){
               var salesCount = 999 - eligibleQuantity;
            if (salesCount > 50) {
                salesCount = "★" + salesCount;
            }
                sales = '<p style="margin: 0;">Sat : '+salesCount+' </p>'
                console.log("salesCount: " + salesCount);
            }
            // Baloncuk oluşturma
            const balloonDiv = document.createElement("div");
            balloonDiv.setAttribute("id", "etsyInfoBalloon");
            balloonDiv.innerHTML = `
                <div style="position: fixed; top: 60px; left: 90%; transform: translateX(-50%); background-color: yellow; border: 1px solid #ccc; border-radius: 5px; padding: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); z-index: 9999;">
                     ${bestseller}
                     ${review}
                     ${sales}
                    <p style="margin: 0;">Fav : ${favoriteCount}</p>
                    <p style="margin: 0;">${listingDate}</p>
                    <p style="margin: 0;">Gün : ${daysAgoFromDate(listingDate)}</p>
                    <p style="margin: 0;">Avg : ${parseFloat(avrage.toFixed(1))}</p>
                    <button id="copy">Kopyala</button>
                </div>
            `;
            // Baloncugu sayfaya ekleme
            document.body.appendChild(balloonDiv);
            // Input elementine erişim
            const inputElement = document.querySelector('input[name="listing_id"]');
            // Değerini alma
            const listingId = inputElement.value;
            // Değeri konsola yazdırma
            console.log("Listing ID:", listingId);

            document.getElementById("copy").onclick = function(){
                navigator.clipboard.writeText("Listing ID:"+listingId+"\n"+listingTitle+"\n"+conText)
                console.log("Metin başarıyla panoya kopyalandı:\nListing ID:"+listingId+"\n"+listingTitle+"\n"+conText);
            }
        }
    }
})();
