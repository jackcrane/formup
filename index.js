/**
 * readRequestBody reads in the incoming request body
 * Use await readRequestBody(..) in an async function to get the string
 * @param {Request} request the incoming request to read from
 */
async function readRequestBody(request) {
  const { headers } = request
  const contentType = headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return JSON.stringify(await request.json())
  }
  else if (contentType.includes("application/text")) {
    return request.text()
  }
  else if (contentType.includes("text/html")) {
    return request.text()
  }
  else if (contentType.includes("form")) {
    const formData = await request.formData()
    const body = {}
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return JSON.stringify(body)
  }
  else {
    const myBlob = await request.blob()
    const objectURL = URL.createObjectURL(myBlob)
    return objectURL
  }
}

async function handleRequest(request) {
  const tos = (new URL(request.url).pathname.split('/')[1]).split(',')

  const reqBody = JSON.parse(await readRequestBody(request));

  const responseArray = ['A new response has been received! Here is the information: \n'];

  for (const [key, value] of Object.entries(reqBody)) {
    responseArray.push(`${key}: ${value}`);
  }

  responseArray.push(`\nThank you for using formup!`)

  let statuses = [];

  for(to in tos) {
    console.log(tos[to])
    let responseText = (responseArray.join('\n'));
    
    let headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");
    headers.append("Authorization", `Basic ${TWILIO_SECRET}`);

    var urlencoded = new URLSearchParams();
    urlencoded.append("Body", responseText);
    urlencoded.append("To", tos[to]);
    urlencoded.append("From", "4302058827");

    var requestOptions = {
      method: 'POST',
      headers: headers,
      body: urlencoded,
      redirect: 'follow'
    };
  
    const apiResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, requestOptions)
    const responseData = await apiResponse.text();

    if(JSON.parse(responseData).status == 'queued') {
      statuses.push('ok');
    } else {
      statuses.push('not-ok');
    }
  }

  if(statuses.every(e => {
    return e == 'ok'
  })) {
    return new Response('Message sent!', {status: 200})
  } else {qqq
    return new Response('Message sending failed.', {status: 400})
  }
}

addEventListener("fetch", async event => {
  const { request } = event
  const { url } = request

  return event.respondWith(handleRequest(request))
})