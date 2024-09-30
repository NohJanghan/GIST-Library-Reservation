import React, { useState } from 'react'

import '../styles/timeSelector.css'

export default function TimeSelector(props) {
    // props type
    // props {
    //     selectedRange: [firstHour, secondHour], //include endHour. It dosn't mean that firstHour < secondHour
    //     onRangeSelected: function([startHour, lastHour]): null,
    //     timeRange: [startHour, endHour] // endHour not included
    //     maxRange: int // 선택할 수 있는 최대 범위
    // }
    if(process.env.NODE_ENV === 'development') {
        console.log('[PROPS]: ' + JSON.stringify(props))
    }

    const [rangeChangeIndex, setRangeChangeIndex] = useState(0)
    function toggleRangeChangeIndex() {
        setRangeChangeIndex((rangeChangeIndex + 1) % 2)
    }

    // time slot이 선택되었을 때 실행될 함수
    function onSlotClicked(event) {
        if(process.env.NODE_ENV === 'development') {
            console.log('[🖱clicked] ' + event.target)
        }

        let newRange = [...props.selectedRange]
        if(newRange.length < 2) {
            newRange[0] = Number(event.target.innerText)
            newRange[1] = Number(event.target.innerText)
        } else {
            newRange[rangeChangeIndex] = Number(event.target.innerText)
        }
        
        // 예약할 수 있는 범위를 넘으면 안됨
        // 만약 넘을 경우 새로 선택한 것만 선택
        if(Math.max(...newRange) - Math.min(...newRange) > props.maxRange) {
            newRange[0] = Number(event.target.innerText)
            newRange[1] = Number(event.target.innerText)
        }
        toggleRangeChangeIndex()
        props.onRangeSelected(newRange)
    }
    
    function getTimeSlotArray(startHour, endHour) {
        let resArr = []
        for(let i = startHour; i < endHour; i++) {
            let className = 'ts_normal'

            // 선택된 요소에 대한 class 지정
            if(props.selectedRange.length === 2 && i >= Math.min(...props.selectedRange) && i <= Math.max(...props.selectedRange)) {
                className = 'ts_selected'
                if(i === props.selectedRange[0] || i === props.selectedRange[1]) {
                    className = className + ' ts_onBoundary'
                }
            }
            resArr.push(<TimeSelector.TimeSlot key={i}  onClick={onSlotClicked} className={className}>{i}</TimeSelector.TimeSlot>)
        }
        return resArr
    }

    return <div className='ts_container'>
        {
            getTimeSlotArray(...props.timeRange)
        }
    </div>

}

TimeSelector.TimeSlot = function({children, ...rest}) {
    return <span {...rest}>{children}</span>
}
TimeSelector.TimeSlot.displayName = 'TimeSlot'