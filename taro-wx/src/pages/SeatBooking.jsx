{seats.map(seat => {
  console.log(`座位ID: ${seat.id}, 状态码: ${seat.status}, 状态文本: ${getSeatStatus(seat.status)}`);
  return (
    <div className="seat" key={seat.id}>
      <p>{seat.name}</p>
      <p className={`status status-${seat.status}`}>
        状态: {getSeatStatus(seat.status)}
      </p>
    </div>
  );
})} 