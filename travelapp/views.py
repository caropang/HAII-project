from django.shortcuts import render
from django.contrib.staticfiles.storage import staticfiles_storage
import pandas as pd
import numpy as np
from sklearn.impute import KNNImputer
import os
import json
from django.http import HttpResponse, Http404

# Create your views here.
def home(request):
    context = {}
    if request.method == 'GET':
        return render(request, 'travelapp/home.html', context)
    
    if request.method == 'POST':
        return render(request, 'travelapp/home.html', context)

def init_model():
    abs_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static/travelapp/data/google_review_ratings.csv')
    df = pd.read_csv(abs_path)
    # Dropping first and last column
    df.drop(columns=df.columns[-1:], axis=1,  inplace=True)
    df.drop(columns=df.columns[:1], axis=1,  inplace=True)

    # Renaming the categories
    new_columns = ['churches', 'resorts', 'beaches',
                'parks', 'theatres', 'museums', 'malls',
                'zoos', 'restaurants', 'pubs and bars', 'local_services',
                'burgers and pizza', 'hotels', 'juice bars', 'art galleries',
                'dance clubs', 'swimming pools', 'gyms', 'bakeries',
                'beauty spas', 'cafes', 'view points', 'monuments',
                'gardens']

    old_columns = list(df.iloc[0].to_dict().keys())
    rename_dict = dict(zip(old_columns, new_columns))
    df = df.rename(columns=rename_dict)
    df.drop(columns='local_services', axis=1,  inplace=True)
    return df

def run_model(questions, answers, filters=[], interests=[]):
    df = init_model()

    columns = ['churches', 'resorts', 'beaches',
                'parks', 'theatres', 'museums', 'malls',
                'zoos', 'restaurants', 'pubs and bars',
                'burgers and pizza', 'hotels', 'juice bars', 'art galleries',
                'dance clubs', 'swimming pools', 'gyms', 'bakeries',
                'beauty spas', 'cafes', 'view points', 'monuments',
                'gardens']

    # Creating and adding user to dataframe
    empty_data = dict(zip(columns, [np.nan] * len(columns)))
    empty_data[questions[0]] = answers[0]
    empty_data[questions[1]] = answers[1]
    empty_data[questions[2]] = answers[2]
    empty_data[questions[3]] = answers[3]
    empty_data[questions[4]] = answers[4]
    
    if (len(filters) > 0):
        for filter in filters:
            if (filter != ''):
                empty_data[filter] = 0
    if (len(interests) > 0):
        for interest in interests:
            if (interest != ''):
                empty_data[interest] = 5
    df.loc[len(df.index)] = list(empty_data.values())

    # Initializing data imputer
    imputer = KNNImputer(n_neighbors=10)
    results = imputer.fit_transform(df)[-1]
    results_sorted = sorted(list(zip(columns, results)), key=lambda x : x[1], reverse=True)
    
    if (len(filters) > 0) or (len(interests) > 0):
        filtered_results = []
        for r in results_sorted:
            if r[0] not in filters and r[0] not in interests:
                filtered_results.append(r)
        results_sorted = filtered_results

    m = lambda x : x[0]
    results_list = (zip(map(m, results_sorted), list(range(1, len(results)+1))))
    return results_list

def serialize_results(results):
    res = []
    for r in results:
        serialized = {'category': r[0], 'rank': r[1]}
        res.append(serialized)
    response_data = {'recommendations': res}
    return response_data

def _json_error_response(message, status=200):
    # You can create your JSON by constructing the string representation yourself (or just use json.dumps)
    response_json = '{ "error": '+message+'" }'
    return HttpResponse(response_json, content_type='application/json', status=status)


def add_filter(request):
    if request.method != 'POST':
        return _json_error_response("You must use a POST request for this operation", status=405)
    if not 'answers' in request.POST or not request.POST['answers']:
        return _json_error_response("Missing answers", status=400)
    if not 'filters' in request.POST:
        return _json_error_response("Missing filters", status=400)
    if not 'interests' in request.POST:
        return _json_error_response("Missing interests", status=400)
    
    answers = request.POST['answers'].split(",")
    filters = request.POST['filters'].split(",")
    interests = request.POST['interests'].split(",")

    questions = ['art galleries', 'restaurants', 'malls', 'dance clubs', 'parks']
    res = run_model(questions, answers, filters, interests)

    response_data = serialize_results(res)
    response_json = json.dumps(response_data)
    response = HttpResponse(response_json, content_type='application/json')
    return response

def get_results(request):
    if request.method != 'POST':
        return _json_error_response("You must use a POST request for this operation", status=405)
    if not 'answers' in request.POST or not request.POST['answers']:
        return _json_error_response("Missing answers", status=400)
    
    answers = request.POST['answers'].split(",")

    questions = ['art galleries', 'restaurants', 'malls', 'dance clubs', 'parks']
    res = run_model(questions, answers)

    response_data = serialize_results(res)
    response_json = json.dumps(response_data)
    response = HttpResponse(response_json, content_type='application/json')
    return response


def quiz(request):
    context = {}
    if request.method == 'GET':
        return render(request, 'travelapp/quiz.html', context)
    
    if request.method == 'POST':
        if ('q_1' in request.POST and
             'q_2' in request.POST and
             'q_3' in request.POST and
             'q_4' in request.POST and
             'q_5' in request.POST):
            questions = ['art galleries', 'restaurants', 'malls', 'dance clubs', 'parks']
            answers = [request.POST['q_1'],
                        request.POST['q_2'],
                        request.POST['q_3'],
                        request.POST['q_4'],
                        request.POST['q_5']]
            context['answers'] = list(zip(questions, answers))
            return render(request, 'travelapp/quiz.html', context)
        else:
            context['error'] = "Please provide an answer for all questions"
            return render(request, 'travelapp/quiz.html', context)