import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from pandas import Timestamp
from datetime import datetime
from matplotlib.dates import DateFormatter
import matplotlib.pyplot as plt
import json

file_path = 'data.json'

with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)


# Create a DataFrame
df = pd.DataFrame(data)

# Tokenize the titles with stop words
stop_words = ['news', 'live', 'tak', 'at2', 'aajtak', 'updates', 'or', 'aaj',
              'viralvideo', 'shorts', 'and39', 'new', 'row', 'viral', 'latest', 'the', 'shortsvideo',
              'tv'
              ]  # Add your stop words to this list
vectorizer = CountVectorizer(stop_words=stop_words)
X = vectorizer.fit_transform(df['title'])

# Topic modeling using Latent Dirichlet Allocation (LDA)
num_topics = 10  # Adjust as needed based on your data
lda = LatentDirichletAllocation(n_components=num_topics, random_state=42)
lda.fit(X.toarray())  # Convert the sparse matrix to an array before fitting

# Assign topics to each video
df['topic'] = lda.transform(X).argmax(axis=1)

# Display the results
print("Topic Modeling Results:")
for topic_idx, topic in enumerate(lda.components_):
    top_words = [vectorizer.get_feature_names_out()[i] for i in topic.argsort()[:-6:-1]]
    topic_name = f"Topic {topic_idx + 1}: {', '.join(top_words)}"
    print(topic_name)
    df.loc[df['topic'] == topic_idx, 'topic'] = topic_name


# Trend analysis and visualization for each topic
df['publishedAt'] = pd.to_datetime(df['publishedAt'])
df.set_index('publishedAt', inplace=True)
df.sort_index(inplace=True)

# Create separate plots for each topic
for topic_name in df['topic'].unique():
    plt.figure(figsize=(20, 20))
    topic_df = df[df['topic'] == topic_name]
    x=pd.DatetimeIndex(topic_df.index).to_list()
    y=topic_df['likes'].values;
    date_objects = [pd.to_datetime(timestamp) for timestamp in x]
    values = [int(value) for value in y]
    md = pd.DataFrame({'Timestamps': date_objects, 'Values': values})
    # Plotting
    plt.figure(figsize=(12, 6))
    plt.plot(md['Timestamps'], md['Values'], marker='o', linestyle='-', color='b',label=topic_name)
    plt.title(f'Trend Analysis - Likes Over Time for {topic_name}')
    plt.xlabel('Timestamps')
    plt.ylabel('Likes')
    plt.xticks(rotation=45)
    plt.gca().xaxis.set_major_formatter(DateFormatter('%Y-%m-%d %H:%M:%S'))
    plt.tight_layout()
    plt.show()



