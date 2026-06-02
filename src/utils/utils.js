const statusOptions = () => {
  return (
    <>
      <option value='pending_confirmation'>Ожидает подтверждения</option>
      <option value='confirmed'>Подтвержден</option>
      <option value='assigned'>Назначен</option>
      <option value='in_transit'>В пути</option>
      <option value='delivered'>Доставлен</option>
      <option value='cancelled'>Отменен</option>
      <option value='rejected'>Отказ</option>
    </>
  );
};

export default statusOptions;
