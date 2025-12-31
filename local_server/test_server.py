"""
Simple test script to verify the local SVC server endpoints respond correctly.
Run after starting the server: python local_server/test_server.py
"""
import requests

BASE = 'http://127.0.0.1:8001'

def test_predict(name, features):
    url = f'{BASE}/predict/{name}'
    payload = {'features': features}
    r = requests.post(url, json=payload, timeout=5)
    print(name, 'status:', r.status_code)
    """
    Simple test script to verify the local SVC server endpoints respond correctly.
    Run after starting the server: python local_server/test_server.py
    """
    import requests

    BASE = 'http://127.0.0.1:8001'


    def test_predict(name, features):
        url = f'{BASE}/predict/{name}'
        payload = {'features': features}
        r = requests.post(url, json=payload, timeout=5)
        print(name, 'status:', r.status_code)
        try:
            print('resp:', r.json())
        except Exception as e:
            print('non-json response:', r.text)


    if __name__ == '__main__':
        # example feature vectors - lengths depend on trained model feature dims
        test_predict('diabetes', [6,148,72,35,0,33.6,0.627,50])
        test_predict('heart', [63,1,3,145,233,1,2.3,150,0,2])
        test_predict('anemia', [11.0,34.0,27.0,32.0,90.0,4.0])