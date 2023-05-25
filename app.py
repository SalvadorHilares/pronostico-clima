from flask import Flask
import osmnx as ox

app = Flask(__name__)

@app.route('/nloc/<lat>/<lon>', methods=['GET'])
def nloc(lat, lon):
    result = {
        'restaurants': []
    }
    try:
        lat, lon = float(lat), float(lon)
        rests = ox.geometries_from_bbox(north=lat + 0.01,south=lat,east=lon + 0.01,west=lon, tags={
            'amenity': 'restaurant',
            'name': True,
            'addr:housenumber': True,
            'addr:street': True,
        })
        columns = ['name', 'amenity', 'addr:housenumber', 'addr:street']
        rests = rests[columns]
        i = 0
        for row in rests.values:
            name = str(row[0])
            amenity = str(row[1])
            address_number = str(row[2])
            address = str(row[3])
            if (name != 'nan' and amenity != 'nan' and address_number != 'nan' and address != 'nan' and amenity == 'restaurant'):
                if (i < 3):
                    result['restaurants'].append({
                        'name': name,
                        'address': address + ' ' + address_number
                    })
                else:
                    break
                i += 1
        print(result)
    except:
        result = {
            'error': 'Invalid coordinates'
        }
    return result

if __name__ == '__main__':
    app.run(debug=True, port=3000)