import Head from 'next/head'
// import styles from '../styles/Home.module.css'

import { useMemo, useRef, useState, useCallback } from 'react'
import DeckGL from '@deck.gl/react';
import {StaticMap} from 'react-map-gl';
import {MVTLayer} from '@deck.gl/geo-layers';
import {_MapContext as MapContext} from 'react-map-gl';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkLWthcCIsImEiOiJjamRpNzU2ZTMxNWE0MzJtZjAxbnphMW5mIn0.b6m4jgFhPOPOYOoaNGmogQ'

const INITIAL_VIEW_STATE = {
  longitude: -118.2467693,
  latitude: 34.040713,
  zoom: 12,
  // Our tiles only exist between zoom 12 and 22
  minZoom: 12,
  maxZoom: 22,
  pitch: 0,
  bearing: 0
};

const laBounds = [
  [-118.66755417, 33.7064461],
  [-118.1555711, 34.32457583],
]

function getTooltip({object}) {
  if (object) {
    const properties = object.properties
    const noMax = object.properties.no_max_density

    const address = (properties["address"] === "0 ") ? "No address" : properties["address"]

    const part1 = `
      <p><b>${address}</b> (PIN: ${properties["PIN"]})</p>
      <p>Current zoning: ${properties["zoning"]}</p>
      <p>Existing units: ${properties["existing_units"]}</p>
    `
    const part2 = noMax ? `
      <p>Proposed units: No max density</p>
      <p>Proposed density: No max density</p>
    ` : `
      <p>Proposed units: ${properties["units"]}</p>
      <p>Proposed density: ${properties["density"]} units/acre</p>
    `

    const part3 = `
      <p>Estimated realistic capacity: ${parseFloat(properties["realistic_capacity"]).toFixed(3)} units</p>
    `
    return {
      html: part1 + part2 + part3,
      style: {
        'background-color': 'white',
        color: 'gray',
        'line-height': '1.5em',
        'font-size': '1em',
      }
    }
  }
}

function getFillColor (object) {
  const noMaxDensity = object.properties.no_max_density
  const density = object.properties["density"]
  const densityFraction = Math.min(density / 200, 1)
  return noMaxDensity ? [0, 255, 0] : [
    (1 - densityFraction) * 255,
    (1 - densityFraction) * 255,
    240,
  ]
}

function getMaxDensityText (object) {
  return object.properties['no_max_density'] ? '' : object.properties["units"].toFixed(1).toString()
}

function getRealisticCapacityText (object) {
  return parseFloat(object.properties["realistic_capacity"]).toFixed(1)
}

export default function Home() {
  const [viewState, setViewState] = useState({zoom: 12})

  const handleViewStateChange = useCallback(({viewState: nextViewState}) => {
    setViewState(nextViewState)
  }, [viewState])

  const [labelType, setLabelType] = useState('max_density')

  const deckGlMap = (
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
        ContextProvider={MapContext.Provider}
        onViewStateChange={handleViewStateChange}
        >
          <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />
          <MVTLayer
            id='shapes'
            data={`https://a.tiles.mapbox.com/v4/sid-kap.7z5xjc4r/{z}/{x}/{y}.vector.pbf?access_token=${MAPBOX_ACCESS_TOKEN}`}
            filled={true}
            opacity={0.3}
            getFillColor={getFillColor}
            pickable={true}
            binary={true}
          />
          <MVTLayer
            id='labels-max-density'
            data={`https://a.tiles.mapbox.com/v4/sid-kap.d6xrhzce/{z}/{x}/{y}.vector.pbf?access_token=${MAPBOX_ACCESS_TOKEN}`}
            filled={false}
            stroked={false}
            getPosition={d => d.coordinates}
            pointType='text'
            getText={getMaxDensityText}
            visible={(viewState.zoom >= 16) && (labelType == 'max_density')}
            textSizeUnits='meters'
            textSizeScale={0.25}
            textFontFamily='sans-serif'
          />
          <MVTLayer
            id='labels-realistic-capacity'
            data={`https://a.tiles.mapbox.com/v4/sid-kap.d6xrhzce/{z}/{x}/{y}.vector.pbf?access_token=${MAPBOX_ACCESS_TOKEN}`}
            filled={false}
            stroked={false}
            getPosition={d => d.coordinates}
            pointType='text'
            getText={getRealisticCapacityText}
            visible={(viewState.zoom >= 16) && (labelType == 'realistic_capacity')}
            textSizeUnits='meters'
            textSizeScale={0.25}
            textFontFamily='sans-serif'
          />
      </DeckGL>
  )

  return (
    <div>
      <Head>
        <title>Los Angeles Draft Housing Element - New Sites</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='container mx-auto h-screen'>
      <h1 className='text-4xl text-center m-2'>Los Angeles Draft Housing Element</h1>
      <div className='relative h-5/6 my-4'>
        {deckGlMap}
      </div>
      <div className='mx-auto text-center'>
      <span className='mr-3 text-gray-500 text-sm'>Label type:</span>
      <input type='radio' checked={labelType == 'max_density'} onChange={() => setLabelType('max_density')} id='max_density' />
        <label htmlFor='max_density' className='ml-1 mr-3'>Max allowed units</label>
        <input type='radio' checked={labelType == 'realistic_capacity'} onChange={() => setLabelType('realistic_capacity')} id='realistic_capacity' />
        <label htmlFor='realistic_capacity' className='ml-1 mr-3'>Realistic capacity</label>
      </div>
      </main>
    </div>
  )
}
