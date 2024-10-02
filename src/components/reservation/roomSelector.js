/*
방 선택을 위한 컴포넌트.
클릭해서 펼칠 수 있음.
클릭하면 펼쳐지면서 onOpen이 실행됨.
시간을 선택하는 컴포넌트가 렌더링됨.
시간을 선택하면 onSelectTime이 실행됨.

[props]
isOpened: Boolean
onOpen: async function

status: enum{'reservable', 'disabled', 'loading', null/undefined}

selectedRange: [from, to]
onSelectRange: async function

onClickReserve: async function
onClickSelectRoom: async function

item: {
    id: Number,
    displayName: String,
    floor: Number,
    timeRange: [fromTime, toTime]
    maxRange: Number
}
*/
import React from "react";
import Chevron from "../../images/Selector/ChevronRight.svg"
import TimeSelector from "./timeSelector";

export default function RoomSelector(props) {

    const {isOpened, selectedRange, status, onOpen, onSelectRange, onClickReserve, onClickSelectRoom, item} = props

    const BottomSection = (status, onClickReserve, onClickSelectRoom, onSelectRange, selectedRange, item) => {
        async function selectRoomHandler(e) {
            // TODO
            await onClickSelectRoom(item, e)
            return null
        }
        async function reserveHandler(e) {
            // TODO
            await onClickReserve(item, e)
            return null
        }
        if(status === 'reservable') {
            return <div className="rs_bottomSection">
                <TimeSelector 
                    selectedRange={selectedRange}
                    onRangeSelected={onSelectRange}
                    timeRange={item.timeRange}
                    maxRange={item.maxRange}
                />
                <button type='button' onClick={selectRoomHandler}>호실 선택</button>
                <button type='button' onClick={reserveHandler}>바로 예약하기</button>
            </div>
        } else if(status === 'disabled') {
            return <div className="rs_bottomSection">
                <p>현재 선택된 시간에는 예약할 수 없습니다.</p>
            </div>

        } else if(status === 'loading') {
            <div className="rs_bottomSection">
                로딩중 //TODO
            </div>
        } else {
            if(process.env.NODE_ENV === 'development') {
                console.error('wrong status')
            }
            return null
        }
    }
    
    async function openHandler(e) {
        const afterState = !isOpened
        const beforeState = isOpened
        await onOpen(afterState, beforeState, e)
        return null
    }

    return <div className='rs_container'>
        <div className="rs_header" onClick={openHandler}>
            {/* TODO: onclick 애니메이션*/}
            <img alt="open/close" src={Chevron} />
            <span>{item.displayName}</span>
            <span>{item.floor + 'F'}</span>
        </div>
        {isOpened && BottomSection(status, onClickReserve, onClickSelectRoom, onSelectRange, selectedRange, item)}
    </div>

}