# HAII-project

### Installation
To preview the project, clone this repository

`$ git clone https://github.com/caropang/HAII-project.git`

Then, run the following commands from the root directory 

`$ python3 manage.py migrate`

`$ python3 manage.py runserver`

Then, navigate to "http://127.0.0.1:8000/" in your browser

### Implementation
This project was built on top of the Django framework. The machine learning aspects were handled using the scikit-learn and pandas libraries. All of the additional code in this repository was implemented by me.

This project actually uses the KNNImputer from the sklearn library to make predictions. I was initially going to train a KNN multi-output regressor. However, in order to be able to adapt to user feedback, the number of inputs and outputs has to be variable which is not possible with a single pre-trained regressor. Although more computationally intensive, the KNNImputer is better suited for this application because it computes the "missing values" ie. values that we want to predict based on all of the data that is available. Therefore, if a user indicates interest or disinterest in certain categories, we can easily take this into account.

### Data
I used the "Travel Review Ratings Dataset" from the UCI Machine Learning Repository for this project which can be found at  [this link](https://archive.ics.uci.edu/ml/datasets/Tarvel+Review+Ratings).

### Future Work
In the future, I would like to improve upon this project by integrating it with real recommendation data. I initially tried scraping TripAdvisor search results, but their anti-scraping mechanisms made it difficult to acheive. I could potentially look into other websites like Yelp or travel blogs to find this information.

I would also like to optimize the recommendation system by running experiments to determine which quiz questions are most predictive of the other categories (to phrase it another way, I'd like to find the optimal subset of categories allows the KNN algorithm to best reconstruct the other categories). 

This could be acheived through a brute force approach that involves generating all possible 5-category subsets of the 23 categories, running the KNN algorithm on each subset, and identifying the subset of categories which yields the highest reconstruction accuracy. This method may be computationally intensive, but it could help improve the accuracy of the recommendations.
