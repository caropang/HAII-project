function displayError(message) {
    let errorElement = document.getElementById("error")
    console.log("inside: ", errorElement.innerHTML)
    errorElement.innerHTML = message
}

function loadResults() {
    // Collect answers
    let answers = document.querySelectorAll('.answer')

    let answers_list = []
    answers_list.push(answers[0].innerHTML.split(" ").pop())
    answers_list.push(answers[1].innerHTML.split(" ").pop())
    answers_list.push(answers[2].innerHTML.split(" ").pop())
    answers_list.push(answers[3].innerHTML.split(" ").pop())
    answers_list.push(answers[4].innerHTML.split(" ").pop())
    
    // Send request
    answers_string = answers_list.join(",")

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) {
            return;
        }
        updatePage(xhr);
    }

    xhr.open("POST", "/travelapp/get-results", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(`answers=${answers_string}&csrfmiddlewaretoken=${getCSRFToken()}`);
}

function updatePage(xhr) {
    if (xhr.status == 200) {
        let response = JSON.parse(xhr.responseText)
        updateResults(response)
    } else if (xhr.status == 0) {
        displayError("Cannot connect to server")
    } else if (xhr.getResponseHeader('content-type') != 'application/json') {
        displayError("Recieved status=" + xhr.status)
    } else {
        let response = JSON.parse(xhr.responseText)
        if (response.hasOwnProperty('error')) {
            displayError(response.error)
        } else {
            displayError(response)
        }
    }
    return
}

function updateResults(response) {
    let rec_elem = document.getElementById("recommendations")
    rec_elem.innerHTML = ""
    let recs = response['recommendations']
    let num = Math.min(recs.length, 10)
    for (let i = 0; i < num; i ++) {
        let rec = recs[i]
        let rec_item = document.createElement("tr")
        rec_item.setAttribute("class", 'rec')
        rec_item.setAttribute("id", rec['rank'])
        rec_item.innerHTML = `
        <td>
            <span>${rec['rank']}.</span>
            <span class="category"> ${rec['category']}</span>
        </td>
        <td>
            <button onclick="interested('${rec['category']}')">
                Interested
            </button>
        </td>
        <td>
            <button onclick="notInterested('${rec['category']}')">
                Not Interested
            </button>
        </td>
        `
        rec_elem.appendChild(rec_item)
    }
}

function loadRecommendations(state) {
    answers_string = state['answers'].join(",")
    filters_string = state['filters'].join(",")
    interests_string = state['interests'].join(",")

    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) {
            return;
        }
        updatePage(xhr);
    }

    xhr.open("POST", "/travelapp/add-filter", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(`answers=${answers_string}&filters=${filters_string}&interests=${interests_string}&csrfmiddlewaretoken=${getCSRFToken()}`);
}

function interested(category) {
    // Add new interest to the page
    let interests_elem = document.getElementById("interests")
    let outer_div = document.createElement("div")
    outer_div.setAttribute("class", "feedback")
    outer_div.setAttribute("id", category)

    let interest = document.createElement("div")
    interest.setAttribute("class", 'interest')
    interest.innerHTML =  category
    outer_div.appendChild(interest)

    let del = document.createElement("button")
    del.setAttribute("class", 'delete')
    del.innerHTML = 'x'
    del.setAttribute("onclick", `removeInterest('${category}')`)
    outer_div.appendChild(del)

    interests_elem.appendChild(outer_div)

    // Send request
    state = getExistingState()
    state['interests'].push(category)

    loadRecommendations(state)
}

function notInterested(category) {
    // Add new filter to the page
    let filters = document.getElementById('filters')
    let outer_div = document.createElement("div")
    outer_div.setAttribute("class", "feedback")
    outer_div.setAttribute("id", category)

    let new_filter = document.createElement("div")
    new_filter.setAttribute("class", "filter")
    new_filter.innerHTML = category
    outer_div.appendChild(new_filter)

    let del = document.createElement("button")
    del.setAttribute("class", 'delete')
    del.innerHTML = 'x'
    del.setAttribute("onclick", `removeNotInterest('${category}')`)
    outer_div.appendChild(del)

    filters.appendChild(outer_div)

    // Send request
    state = getExistingState()
    state['filters'].push(category)
    loadRecommendations(state)
}

function removeInterest(category) {
    let elem = document.getElementById(category)
    elem.remove()

    let state = getExistingState()
    let index = state['interests'].indexOf(category)
    state['interests'].splice(index, index+1)

    loadRecommendations(state)
}

function removeNotInterest(category) {
    let elem = document.getElementById(category)
    elem.remove()

    let state = getExistingState()
    let index = state['filters'].indexOf(category)
    state['filters'].splice(index, index+1)

    loadRecommendations(state)
}

function getExistingState() {
    // Collect other filters and quiz results
    let all_filters = document.querySelectorAll('.filter')
    let all_interests = document.querySelectorAll('.interest')
    let answers = document.querySelectorAll('.answer')

    let answers_list = []
    answers_list.push(answers[0].innerHTML.split(" ").pop())
    answers_list.push(answers[1].innerHTML.split(" ").pop())
    answers_list.push(answers[2].innerHTML.split(" ").pop())
    answers_list.push(answers[3].innerHTML.split(" ").pop())
    answers_list.push(answers[4].innerHTML.split(" ").pop())
    
    let filters_list = []
    for (let f of all_filters) {
        filters_list.push(f.innerHTML)
    }

    let interests_list = []
    for (let i of all_interests) {
        interests_list.push(i.innerHTML)
    }

    return {'answers': answers_list,
            'filters': filters_list,
            'interests': interests_list}
}

function getCSRFToken() {
    let cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i].trim()
        if (c.startsWith("csrftoken=")) {
            return c.substring("csrftoken=".length, c.length)
        }
    }
    return "unknown"
}